from django.contrib import admin
from .models import TrackBlock, Switch, Train


@admin.register(TrackBlock)
class TrackBlockAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'posicao_y', 'posicao_inicio_x', 'posicao_fim_x', 'ocupado', 'trem_ocupante')
    list_editable = ('posicao_y', 'ocupado', 'trem_ocupante')


@admin.register(Switch)
class SwitchAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'posicao_x', 'posicao_y', 'estado')
    list_editable = ('estado',)


@admin.register(Train)
class TrainAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'origem_x', 'origem_y', 'destino', 'velocidade_px_ms', 'status')
    list_editable = ('destino', 'status')