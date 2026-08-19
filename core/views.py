from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import TrackBlock, Switch, Train


def cco_view(request):
    blocos = TrackBlock.objects.all()
    amvs = Switch.objects.all()
    trens = Train.objects.all()
    
    # Estações dinâmicas injetadas na view (você pode ajustar as coordenadas x e y conforme seu SVG)
    estacoes = [
        {'codigo': 'EST A', 'posicao_x': 70, 'posicao_y': 100},
        {'codigo': 'EST B', 'posicao_x': 900, 'posicao_y': 100},
        {'codigo': 'EST C', 'posicao_x': 900, 'posicao_y': 200},
    ]

    return render(request, 'core/cco.html', {
        'blocos': blocos,
        'amvs': amvs,
        'trens': trens,
        'estacoes': estacoes,  # ← Enviado dinamicamente para o HTML
    })


@csrf_exempt
def atualizar_bloco(request, codigo):
    if request.method != 'POST':
        return JsonResponse({'erro': 'Método não permitido'}, status=405)

    try:
        bloco = TrackBlock.objects.get(codigo=codigo)
    except TrackBlock.DoesNotExist:
        return JsonResponse({'erro': 'Bloco não encontrado'}, status=404)

    ocupado = request.POST.get('ocupado') == 'true'
    trem = request.POST.get('trem', '')

    bloco.ocupado = ocupado
    bloco.trem_ocupante = trem if ocupado else ''
    bloco.save()

    return JsonResponse({
        'codigo': bloco.codigo,
        'ocupado': bloco.ocupado,
        'trem_ocupante': bloco.trem_ocupante,
    })


@csrf_exempt
def alternar_amv(request, codigo):
    if request.method != 'POST':
        return JsonResponse({'erro': 'Método não permitido'}, status=405)

    try:
        amv = Switch.objects.get(codigo=codigo)
    except Switch.DoesNotExist:
        return JsonResponse({'erro': 'AMV não encontrado'}, status=404)

    amv.estado = Switch.DESVIADO if amv.estado == Switch.RETO else Switch.RETO
    amv.save()

    return JsonResponse({
        'codigo': amv.codigo,
        'estado': amv.estado,
    })


@csrf_exempt
def atualizar_trem(request, codigo):
    """Atualiza o status de um trem."""
    if request.method != 'POST':
        return JsonResponse({'erro': 'Método não permitido'}, status=405)

    try:
        trem = Train.objects.get(codigo=codigo)
    except Train.DoesNotExist:
        return JsonResponse({'erro': 'Trem não encontrado'}, status=404)

    novo_status = request.POST.get('status')
    if novo_status in dict(Train.STATUS_CHOICES):
        trem.status = novo_status
        trem.save()

    return JsonResponse({
        'codigo': trem.codigo,
        'status': trem.status,
    })