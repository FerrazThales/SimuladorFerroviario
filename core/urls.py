from django.urls import path
from . import views

urlpatterns = [
    path('', views.cco_view, name='cco'),
    path('api/bloco/<str:codigo>/', views.atualizar_bloco, name='atualizar_bloco'),
    path('api/amv/<str:codigo>/', views.alternar_amv, name='alternar_amv'),
    path('api/trem/<str:codigo>/', views.atualizar_trem, name='atualizar_trem'),
]