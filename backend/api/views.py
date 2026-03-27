import json
from django.utils import timezone as tz
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import User, Exam, Question, ExamRegistration, ExamAttempt
from .serializers import (UserSerializer, ExamSerializer, QuestionSerializer, 
                          ExamRegistrationSerializer, ExamAttemptSerializer, MyTokenObtainPairSerializer)
from rest_framework_simplejwt.views import TokenObtainPairView

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

from .blockchain import record_score_on_blockchain

# In a realistic setup, the deployed contract address should be dynamically loaded.
# For local hardhat testing, the first deployed contract is generally:
DEPLOYED_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

class RegisterUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        exam_id = self.request.query_params.get('exam')
        if exam_id:
            return self.queryset.filter(exam_id=exam_id)
        return self.queryset

class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.all()
    serializer_class = ExamSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['get'])
    def questions(self, request, pk=None):
        exam = self.get_object()
        now = tz.now()
        # Enforce strict timing to prevent early access
        if now < exam.start_time:
            return Response({"error": "Exam has not started yet."}, status=status.HTTP_403_FORBIDDEN)
        if now > exam.end_time:
            return Response({"error": "Exam has ended."}, status=status.HTTP_403_FORBIDDEN)
            
        questions = exam.questions.all()
        # Make a specialized response that omits the 'correct_answer' to prevent cheating
        qs_data = [{'id': q.id, 'text': q.text, 'options': q.options, 'marks': q.marks} for q in questions]
        return Response(qs_data)

    @action(detail=True, methods=['post'])
    def register(self, request, pk=None):
        exam = self.get_object()
        user = request.user
        if ExamRegistration.objects.filter(user=user, exam=exam).exists():
            return Response({"error": "Already registered"}, status=400)
        ExamRegistration.objects.create(user=user, exam=exam)
        return Response({"status": "Registered successfully"})

    @action(detail=True, methods=['post'])
    def submit_exam(self, request, pk=None):
        exam = self.get_object()
        user = request.user
        
        now = tz.now()
        if now < exam.start_time:
            return Response({"error": "Exam has not started yet."}, status=400)
        if now > exam.end_time:
            return Response({"error": "Exam has ended."}, status=400)
        
        if ExamAttempt.objects.filter(user=user, exam=exam).exists():
            return Response({"error": "Exam already attempted."}, status=400)

        submitted_answers = request.data.get('answers', {})
        score = 0
        questions = exam.questions.all()
        
        for q in questions:
            ans = submitted_answers.get(str(q.id))
            if ans and ans == q.correct_answer:
                score += q.marks

        attempt = ExamAttempt.objects.create(
            user=user,
            exam=exam,
            submitted_answers=submitted_answers,
            score=score
        )

        import hashlib
        score_hash = hashlib.sha256(f"{user.username}:{exam.id}:{score}".encode()).hexdigest()
        
        tx_hash = record_score_on_blockchain(user.id, exam.id, score_hash, DEPLOYED_CONTRACT_ADDRESS)
        
        if tx_hash:
            attempt.blockchain_tx_hash = tx_hash
            attempt.save()

        return Response({
            "status": "Submitted successfully",
            "score": score,
            "blockchain_tx": tx_hash
        })

    @action(detail=True, methods=['get'])
    def admin_results(self, request, pk=None):
        if request.user.role != 'Admin':
            return Response({"error": "Forbidden"}, status=403)
        exam = self.get_object()
        attempts = ExamAttempt.objects.filter(exam=exam)
        serializer = ExamAttemptSerializer(attempts, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_results(self, request):
        attempts = ExamAttempt.objects.filter(user=request.user)
        serializer = ExamAttemptSerializer(attempts, many=True)
        return Response(serializer.data)
