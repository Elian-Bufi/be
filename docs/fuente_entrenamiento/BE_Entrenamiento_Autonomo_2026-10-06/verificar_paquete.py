#!/usr/bin/env python3
"""Verifica este paquete sin red ni dependencias externas. NO ejecuta ni prueba BE."""
from pathlib import Path
import hashlib
import json
import math
import struct

ROOT = Path(__file__).resolve().parent

def read(name):
    return json.loads((ROOT / name).read_text(encoding='utf-8'))

def require(condition, message):
    if not condition:
        raise AssertionError(message)

def numeric(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x)

def relationship(case):
    kind, value = case['type'], case['actual']
    if kind == 'empty_submission':
        return 'no_hay_datos_realizados' if all(v is None for v in value.values()) else 'hay_datos'
    target = case['target']
    if value is None:
        return 'sin_dato'
    if kind == 'reps':
        if not isinstance(value, int) or isinstance(value, bool) or not 0 <= value <= 1000:
            return 'invalido'
        if target is None:
            return 'sin_objetivo'
        low = target.get('min', target.get('value'))
        high = target.get('max', target.get('value'))
        if not isinstance(low, int) or not isinstance(high, int) or not 1 <= low <= high <= 1000:
            return 'invalido'
        return 'debajo' if value < low else 'encima' if value > high else 'dentro'
    if kind == 'rir':
        if not numeric(value) or not 0 <= value <= 20:
            return 'invalido'
        if target is None:
            return 'sin_objetivo'
        return 'debajo' if value < target else 'encima' if value > target else 'igual'
    if kind == 'load':
        if not numeric(value['value']) or value['value'] < 0:
            return 'invalido'
        if target is None:
            return 'sin_objetivo'
        if value['unit'] != target['unit']:
            return 'unidades_incompatibles'
        return 'debajo' if value['value'] < target['value'] else 'encima' if value['value'] > target['value'] else 'igual'
    raise AssertionError(f'Tipo no contemplado: {kind}')

def intersection(a, b, c, d):
    return max(0, min(b, d) - max(a, c))

def temporal(case):
    kind = case['kind']
    if kind == 'duplicates':
        unique = {}
        for event in case['events']:
            if event['id'] in unique:
                require(unique[event['id']] == event, 'Mismo ID con payload diferente')
            unique[event['id']] = event
        ordered = sorted(unique.values(), key=lambda e:e['offset'])
        require([e['type'] for e in ordered] == ['start', 'end'], 'Secuencia de fixture inválida')
        return {'uniqueEvents':len(ordered), 'restSeconds':ordered[1]['offset']-ordered[0]['offset']}
    a, b = case['start'], case['end']
    if kind == 'interval':
        if a is None:
            return {'seconds':None,'quality':'sin_dato'}
        if b is None:
            return {'seconds':None,'quality':'incompleto'}
        if b < a:
            return {'seconds':None,'quality':'invalido'}
        return {'seconds':b-a,'quality':'medido' if case['source']=='monotonic' else 'estimado'}
    if kind == 'rest':
        duration = None if a is None or b is None else b-a
        delta = None if duration is None or case['target'] is None else duration-case['target']
        return {'seconds':duration,'differenceSeconds':delta}
    if kind == 'session':
        require(a <= b, 'Sesión con duración negativa')
        pauses = sorted(case['pauses'])
        previous_end = a
        for start, end in pauses:
            require(a <= start <= end <= b and start >= previous_end,'Pausas inválidas o solapadas en fixture')
            previous_end = end
        pause = sum(end-start for start,end in pauses)
        spans = sorted(case['exerciseSpans'],key=lambda e:e['start'])
        previous_end = a
        exercises = {}
        for span in spans:
            start, end = span['start'], span['end']
            require(a <= start <= end <= b and start >= previous_end,'Ejercicios solapados en fixture')
            previous_end = end
            seconds = end-start-sum(intersection(start,end,p,q) for p,q in pauses)
            exercises[span['exercise']] = exercises.get(span['exercise'],0)+seconds
        active = b-a-pause
        return {'elapsedSeconds':b-a,'pauseSeconds':pause,'withoutPausesSeconds':active,
                'exerciseSeconds':exercises,'unassignedSeconds':active-sum(exercises.values())}
    raise AssertionError(f'Tipo no contemplado: {kind}')

def main():
    manifest = ROOT / 'MANIFEST.sha256'
    require(manifest.is_file(), 'Falta MANIFEST.sha256')
    listed = set()
    for line in manifest.read_text(encoding='utf-8').splitlines():
        digest, relative = line.split('  ', 1)
        path = (ROOT / relative).resolve()
        require(path.is_relative_to(ROOT), 'Ruta fuera del paquete')
        require(path.is_file(), f'Falta {relative}')
        require(hashlib.sha256(path.read_bytes()).hexdigest() == digest, f'Hash distinto: {relative}')
        listed.add(relative)
    actual = {p.relative_to(ROOT).as_posix() for p in ROOT.rglob('*') if p.is_file() and p.name != 'MANIFEST.sha256' and '__pycache__' not in p.parts}
    require(actual == listed,'El manifiesto no coincide con el contenido')
    print('Integridad SHA-256: OK')

    assets = read('ejercicios/CATALOGO.json')['assets']
    keys = set()
    for asset in assets:
        require(asset['fixtureKey'] not in keys,'Identidad de fixture duplicada')
        keys.add(asset['fixtureKey'])
        data = (ROOT / asset['image']).read_bytes()
        require(data[:8] == b'\x89PNG\r\n\x1a\n','No es PNG')
        width,height,depth,color = struct.unpack('>IIBB',data[16:26])
        require(width >= 512 and height >= 512,'Imagen de resolución insuficiente')
        require(color in (4,6),'PNG de ejercicio sin canal alfa')
        require(asset['realCatalogId'] is None and asset['realExerciseVersionId'] is None,'El paquete no debe inventar IDs de BE')
    for path in (ROOT/'referencias').glob('*.png'):
        require(path.read_bytes()[:8] == b'\x89PNG\r\n\x1a\n','Referencia no PNG')
    print('3 recursos de ejercicios PNG con alfa y 3 referencias PNG: OK')

    session = read('datos/sesion_demo.json')
    require(session['synthetic'] is True,'Falta marcar datos sintéticos')
    require(sum(len(e['sets']) for e in session['exercises']) == session['seriesCount'] == 9,'Recuento de series incorrecto')
    for exercise in session['exercises']:
        require(exercise['catalogFixtureKey'] in keys,'Ejercicio sin recurso asociado')
        require([s['setIndex'] for s in exercise['sets']] == [1,2,3],'Orden de series incorrecto')
    a = session['exercises'][0]['sets']
    require([(s['plannedRepetitions']['min'],s['plannedRepetitions']['max']) for s in a] == [(12,16),(10,12),(8,10)],'Rangos del encargo alterados')
    require([s['recommendedRestSeconds'] for s in a] == [90,120,150],'Descansos alterados')
    require(session['startingActualValues'] is None,'Los realizados no deben venir rellenados')
    print('Sesión sintética de 3 ejercicios y 9 series: OK')

    series = read('datos/casos_series.json')['cases']
    for case in series:
        result = relationship(case)
        require(result == case['expected'], f"{case['id']}: {result!r} != {case['expected']!r}")
    print(f'{len(series)}/{len(series)} casos de series: OK')
    times = read('datos/casos_tiempos.json')['cases']
    for case in times:
        result = temporal(case)
        require(result == case['expected'], f"{case['id']}: {result!r} != {case['expected']!r}")
    print(f'{len(times)}/{len(times)} casos de tiempos: OK')
    print('Esta verificación comprueba el paquete; NO prueba la implementación de BE.')

if __name__ == '__main__':
    main()
