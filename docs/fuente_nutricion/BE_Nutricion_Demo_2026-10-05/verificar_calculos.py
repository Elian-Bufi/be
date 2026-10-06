"""Verifica el conjunto numérico de la demo. No verifica ni modifica BE."""
from pathlib import Path
from fractions import Fraction
from decimal import Decimal, ROUND_HALF_UP
import json

ROOT = Path(__file__).resolve().parent
def read(name):
    return json.loads((ROOT/'datos'/name).read_text(encoding='utf-8'))

foods = {f['id']: f for f in read('alimentos_usda_100g.json')['foods']}
recipes = {r['id']: r for r in read('recetas_demo.json')['recipes']}
source = {f['fdcId']: f for f in read('usda_fuentes_completas.json')}
ids = {'energy_kcal':1008,'carbohydrate_g':1005,'fat_g':1004,'protein_g':1003,'fiber_g':1079}
assert len(foods)==8 and len(recipes)==3
assert foods['brocoli_cocido']['source']['fdc_id']==169967

for f in foods.values():
    raw=source[f['source']['fdc_id']]
    assert f['source']['description_original']==raw['description']
    nutrients={n['nutrient']['id']:n['amount'] for n in raw['foodNutrients'] if n['nutrient']['id'] in ids.values()}
    for name,nid in ids.items():
        assert Fraction(f['nutrients_per_100g'][name])==Fraction(str(nutrients[nid]))

def calculate(recipe, factor='1', overrides=None):
    overrides=overrides or {}
    total={name:Fraction(0) for name in ids}
    for item in recipe['items']:
        quantity=Fraction(overrides.get(item['food_id'],item['quantity_g']))
        assert quantity>=0
        for name in ids:
            value=Fraction(foods[item['food_id']]['nutrients_per_100g'][name])
            total[name] += quantity*value*Fraction(factor)/100
    return total

for recipe in recipes.values():
    assert (ROOT/recipe['image']).is_file()
    assert sum(Fraction(i['quantity_g']) for i in recipe['items'])==Fraction(recipe['total_edible_weight_g'])
    actual=calculate(recipe)
    for name,value in actual.items():
        assert value==Fraction(recipe['expected_nutrients_unrounded'][name]),(recipe['id'],name)
        dec=Decimal(value.numerator)/Decimal(value.denominator)
        quantum=Decimal('1') if name=='energy_kcal' else Decimal('0.1')
        assert str(dec.quantize(quantum,rounding=ROUND_HALF_UP))==recipe['display_nutrients'][name]

cases=read('casos_calculo.json')['numeric_cases']
for case in cases:
    result=calculate(recipes[case['recipe_id']],case['factor'],case['quantity_overrides_g'])
    for name,value in result.items():
        assert value==Fraction(case['expected'][name]),(case['id'],name)

# Anclas calculadas separadamente para detectar alteraciones del conjunto base.
anchors={
 'BE-DEMO-NUT-001':('529.22','56.57','13.186','43.964'),
 'BE-DEMO-NUT-002':('579.6','51.466','24.155','39.644'),
 'BE-DEMO-NUT-003':('458.52','75.08','9.4','21.286')}
for recipe_id,expected in anchors.items():
    result=calculate(recipes[recipe_id])
    for name,value in zip(list(ids)[:4],expected):
        assert result[name]==Fraction(value),(recipe_id,name)

print(f'OK: {len(foods)} alimentos contrastados con la fuente; {len(recipes)} recetas; {len(cases)} casos numéricos; redondeo y archivos de imagen verificados.')
print('Alcance: datos y aritmética del paquete. La aplicación BE, la carga profesional, los permisos y Android todavía deben probarse por separado.')
