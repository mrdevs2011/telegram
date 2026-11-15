from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import login, authenticate, logout
from django.db import IntegrityError
from django.db.models import Q
from chatapp.models import Message

def index(request):
    if request.user.is_authenticated:
        return redirect('contact')
    return redirect('login')

def auth(request):
    if request.user.is_authenticated:
        return redirect('contact')
    if request.method == "POST":
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(username=username, password=password)

        if user is not None:
            login(request, user)
            return redirect('contact')
        elif user is None:
            return render(request, 'login.html', {'error': 'Foydalanuvchi nomi yoki parol xato!'})

    return render(request, 'login.html')



def signup(request):
    if request.user.is_authenticated:
        return redirect('contact')
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        try:
            user = User.objects.create_user(username=username, password=password)
            login(request, user)
            return redirect('contact')
        except IntegrityError:
            return render(request, 'signup.html', {'error': "Bu username band. Agar bu sizning hisobingiz bo'lsa, tizimga kiring."})

    return render(request, 'signup.html')

@login_required(login_url='login')
def contact(request,):
 return render(request, 'contact.html', {'users': User.objects.exclude(id=request.user.id)})

@login_required(login_url='login')
def chat(request, username):
    other_user = User.objects.get(username=username)

    if request.method == 'POST':
        text = request.POST.get('text')
        if text and text.strip():
            Message.objects.create(sender=request.user, receiver=other_user, text=text.strip())
        return redirect(f"/chat/{username}/#bottom")

    reciever = User.objects.get(username=username)
    my_messsages = Message.objects.filter(sender_id=request.user.id, receiver_id=reciever.id)
    his_messages = Message.objects.filter(sender_id=reciever.id, receiver_id=request.user.id)
    messages = my_messsages | his_messages
    messages = messages.order_by('-timestamp')

    return render(request, 'chat.html', {'messages': messages, 'chat_user': username})

def log_out(request):
    logout(request)
    return redirect('login')
