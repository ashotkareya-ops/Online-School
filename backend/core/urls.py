from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import MyTokenObtainPairView, get_me, setup_profile, register

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/user/me/', get_me, name='get_me'),
    path('api/user/setup/', setup_profile, name='setup_profile'),
    path('api/register/', register, name='register'),
    path('api/tasks/', include('tasks.urls')),  # ← добавить
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)