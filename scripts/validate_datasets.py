"""Valida arquivos baixáveis, coerência e exercícios de limpeza com Pandas."""
from pathlib import Path
import json
import pandas as pd
root=Path(__file__).resolve().parents[1]
catalog=json.loads((root/'src/data/datasets.json').read_text(encoding='utf-8'))
frames={}
for item in catalog:
    csv=pd.read_csv(root/f'public/datasets/{item["slug"]}.csv',encoding='utf-8-sig')
    xlsx=pd.read_excel(root/f'public/datasets/{item["slug"]}.xlsx')
    pd.testing.assert_frame_equal(csv,xlsx,check_dtype=False,check_exact=False)
    assert csv.shape==(item['rows'],item['columns'])
    assert list(csv.columns)==[d['name'] for d in item['dictionary']]
    assert csv.iloc[:,0].is_unique
    frames[item['slug']]=csv
sales=frames['vendas']
sales_dates = pd.to_datetime(sales.data)
assert set(sales_dates.dt.year) == {2024, 2025}
assert len(sales_dates.dt.to_period('M').unique()) == 24
assert ((sales.quantidade*sales.preco_unitario).round(2)==sales.receita).all()
assert (sales.custo<=sales.receita).all()
assert frames['atendimento'].satisfacao.isna().sum()==24
assert frames['educacao'].nota.isna().sum()==15
assert (frames['marketing'].cliques<=frames['marketing'].impressoes).all()
assert (frames['marketing'].conversoes<=frames['marketing'].cliques).all()
assert (frames['ecommerce'].pedidos<=frames['ecommerce'].carrinhos).all()
assert (frames['ecommerce'].carrinhos<=frames['ecommerce'].sessoes).all()
assert frames['fraudes'].score_risco.between(0,1).all()
log=frames['logistica']
assert (log.no_prazo==(log.entrega_dias<=log.prazo_dias)).all()
print(f'OK: {len(catalog)} pares CSV/XLSX, 6.000 linhas e regras de coerência validados.')
