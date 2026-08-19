from django.db import models


class TrackBlock(models.Model):
    """
    Representa um trecho (bloco) da via ferroviária baseado em coordenadas.
    """
    codigo = models.CharField(max_length=20, unique=True)
    posicao_y = models.FloatField(default=100.0)  # Coordenada Y dinâmica (ex: 100 para cima, 200 para baixo)
    posicao_inicio_x = models.FloatField()
    posicao_fim_x = models.FloatField()
    ocupado = models.BooleanField(default=False)
    trem_ocupante = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"{self.codigo} (Y: {self.posicao_y})"

    class Meta:
        ordering = ['posicao_inicio_x']
        verbose_name = "Bloco de Via"
        verbose_name_plural = "Blocos de Via"


class Switch(models.Model):
    RETO = 'reto'
    DESVIADO = 'desviado'

    ESTADOS = [
        (RETO, 'Reto'),
        (DESVIADO, 'Desviado'),
    ]

    codigo = models.CharField(max_length=20, unique=True)
    posicao_x = models.FloatField()
    posicao_y = models.FloatField(default=150)
    estado = models.CharField(max_length=10, choices=ESTADOS, default=RETO)

    def __str__(self):
        return f"{self.codigo} ({self.get_estado_display()})"

    class Meta:
        ordering = ['posicao_x']
        verbose_name = "AMV"
        verbose_name_plural = "AMVs"


class Train(models.Model):
    AGUARDANDO = 'aguardando'
    EM_MOVIMENTO = 'em_movimento'
    PARADO = 'parado'
    CHEGOU = 'chegou'

    STATUS_CHOICES = [
        (AGUARDANDO, 'Aguardando'),
        (EM_MOVIMENTO, 'Em Movimento'),
        (PARADO, 'Parado (bloqueado)'),
        (CHEGOU, 'Chegou ao Destino'),
    ]

    DESTINO_CHOICES = [
        ('B', 'Estação B'),
        ('C', 'Estação C'),
    ]

    codigo = models.CharField(max_length=20, unique=True)
    origem_x = models.FloatField(default=100)
    origem_y = models.FloatField(default=150)
    velocidade_px_ms = models.FloatField(default=0.0513)
    destino = models.CharField(max_length=1, choices=DESTINO_CHOICES, default='B')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default=AGUARDANDO)

    def __str__(self):
        return f"Trem {self.codigo}"

    class Meta:
        ordering = ['codigo']
        verbose_name = "Trem"
        verbose_name_plural = "Trens"