from django.urls import path
from chatapp.views import index, auth, signup, contact, chat, log_out


urlpatterns = [
    path('', index, name="index"),
    path('login/', auth, name="login"),
    path('signup/', signup, name="signup"),
    path('contact/', contact, name="contact"),
    path('chat/<str:username>/', chat, name="chat"),
    path('logout/', log_out, name="logout")
]
