"""Dados sintéticos reproduzíveis; não contêm informações pessoais reais."""
from pathlib import Path
import argparse
import json
import random
from datetime import date, timedelta
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'datasets'
OUT.mkdir(parents=True, exist_ok=True)
random.seed(42)
N = 600
def pick(values): return random.choice(values)
def money(a, b): return round(random.uniform(a, b), 2)
def dt(i): return str(date(2025, 1, 1) + timedelta(days=i % 365))
def sales_date(i):
    year = 2024 + (i - 1) // (N // 2)
    start = date(year, 1, 1)
    days = (date(year + 1, 1, 1) - start).days
    return str(start + timedelta(days=((i - 1) % (N // 2)) * days // (N // 2)))
rows = {key: [] for key in ['vendas','rh','financeiro','estoque','ecommerce','marketing','atendimento','logistica','educacao','fraudes']}
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--dataset', choices=rows, help='Regenera os arquivos baixáveis somente da base indicada.')
args = parser.parse_args()
for i in range(1, N+1):
    q = random.randint(1, 12); price = money(35, 450); revenue = round(q*price, 2)
    rows['vendas'].append(dict(pedido_id=i,data=sales_date(i),cliente_id=1+i%120,produto_id=1+i%20,regiao=pick(['Sul','Sudeste','Norte','Nordeste','Centro-Oeste']),canal=pick(['Online','Loja','Parceiro']),quantidade=q,preco_unitario=price,receita=revenue,custo=round(revenue*random.uniform(.45,.85),2)))
    rows['rh'].append(dict(colaborador_id=i,departamento=pick(['Comercial','Produto','Operações','Financeiro']),admissao=str(date(2021,1,1)+timedelta(days=i*2)),salario=money(2500,18000),horas_treinamento=random.randint(0,80),status=pick(['Ativo','Ativo','Ativo','Desligado']),avaliacao=random.randint(1,5)))
    rows['financeiro'].append(dict(transacao_id=i,data=dt(i),centro_custo=pick(['Operações','Marketing','Tecnologia']),tipo=pick(['Receita','Despesa']),valor=money(100,15000),status=pick(['Pago','Pendente','Vencido']),vencimento=str(date(2025,1,1)+timedelta(days=i%365+30))))
    stock=random.randint(0,300); minimum=random.randint(10,50)
    rows['estoque'].append(dict(movimento_id=i,data=dt(i),produto_id=1+i%20,deposito=pick(['A','B','C']),saldo=stock,estoque_minimo=minimum,custo_unitario=money(10,200),reposicao_necessaria=int(stock<minimum)))
    visits=random.randint(100,5000); orders=random.randint(1,visits//10)
    rows['ecommerce'].append(dict(registro_id=i,data=dt(i),canal=pick(['Orgânico','Pago','Direto']),sessoes=visits,carrinhos=orders+random.randint(1,100),pedidos=orders,receita=round(orders*money(50,250),2),dispositivo=pick(['Mobile','Desktop'])))
    impressions=random.randint(1000,50000); clicks=random.randint(20,impressions//8); conversions=random.randint(1,max(1,clicks//10))
    rows['marketing'].append(dict(registro_id=i,data=dt(i),campanha=pick(['Marca','Aquisição','Retenção']),impressoes=impressions,cliques=clicks,conversoes=conversions,investimento=money(100,3000),receita_atribuida=round(conversions*money(80,250),2)))
    rows['atendimento'].append(dict(ticket_id=i,data=dt(i),canal=pick(['Chat','Email','Telefone']),categoria=pick(['Dúvida','Incidente','Solicitação']),tempo_resposta_min=random.randint(1,120),tempo_resolucao_h=money(.5,72),resolvido=pick([0,1,1,1]),satisfacao=None if i%25==0 else random.randint(1,5)))
    promised=random.randint(2,10); actual=random.randint(1,14)
    rows['logistica'].append(dict(entrega_id=i,data=dt(i),regiao=pick(['Sul','Sudeste','Norte','Nordeste']),prazo_dias=promised,entrega_dias=actual,no_prazo=int(actual<=promised),distancia_km=random.randint(10,2000),custo_frete=money(25,500)))
    rows['educacao'].append(dict(matricula_id=i,turma=pick(['A','B','C','D']),curso=pick(['SQL','Python','Power BI']),nota=None if i%40==0 else money(0,10),frequencia=money(.4,1),concluido=pick([0,1,1]),carga_horaria=pick([20,40,60])))
    fraud=int(i%17==0); risk=money(.75,1) if fraud else money(0,.74)
    rows['fraudes'].append(dict(transacao_id=i,data=dt(i),conta_id=1+i%100,valor=money(15,20000),canal=pick(['Pix','Cartão','Transferência']),score_risco=risk,fraude_confirmada=fraud,pais=pick(['BR','BR','BR','AR','US'])))

details = [
 ('vendas','Vendas de uma empresa','Vendas','Pedidos, produtos, canais e custos de 2024 e 2025 para análise comercial.','Iniciante',['Receita','Ticket médio','Margem'],['Receita por região e canal','Comparação anual de vendas','Sazonalidade mensal']),
 ('rh','Pessoas e desenvolvimento','Recursos Humanos','Colaboradores sintéticos e indicadores de capacitação.','Iniciante',['Headcount','Salário médio','Horas de treinamento'],['Distribuição salarial','Capacitação por departamento']),
 ('financeiro','Fluxo financeiro','Financeiro','Receitas, despesas, vencimentos e centros de custo.','Intermediário',['Saldo','Receita','Inadimplência'],['Evolução do saldo','Despesas por centro de custo']),
 ('estoque','Movimentação de estoque','Estoque','Saldos por produto, depósito e dia.','Iniciante',['Valor de estoque','Ruptura','Itens abaixo do mínimo'],['Necessidade de reposição','Comparação entre depósitos']),
 ('ecommerce','Jornada de e-commerce','E-commerce','Sessões, carrinhos e pedidos agregados por canal.','Intermediário',['Conversão','Receita por sessão','Abandono'],['Funil de compra','Desempenho mobile']),
 ('marketing','Campanhas digitais','Marketing','Investimento, impressões, cliques e conversões.','Intermediário',['CTR','CPC','ROAS'],['Eficiência por campanha','Retorno de mídia']),
 ('atendimento','Central de atendimento','Atendimento','Tickets com tempos de resposta e avaliação opcional.','Iniciante',['CSAT','Resolução','Tempo de resposta'],['Qualidade por canal','Tratamento de avaliações ausentes']),
 ('logistica','Entregas e distribuição','Logística','Prazos, distâncias e custos de entregas fictícias.','Intermediário',['Entregas no prazo','Frete médio','Prazo médio'],['Atrasos por região','Custos por quilômetro']),
 ('educacao','Aprendizagem e resultados','Educação','Notas, frequência e conclusão em cursos de dados.','Iniciante',['Conclusão','Nota média','Frequência'],['Resultados por curso','Tratamento de notas ausentes']),
 ('fraudes','Transações e risco','Prevenção a Fraudes','Transações rotuladas para exercícios de análise de risco.','Avançado',['Taxa de fraude','Valor em risco','Precisão'],['Distribuição de scores','Fraude por canal'])]
descriptions={'data':'Data do evento (YYYY-MM-DD)','receita':'Quantidade × preço unitário, em BRL','custo':'Custo total do pedido em BRL','salario':'Salário mensal fictício em BRL','score_risco':'Pontuação entre 0 e 1; não representa um modelo real','satisfacao':'Avaliação de 1 a 5; valores ausentes a cada 25 tickets','nota':'Nota de 0 a 10; ausente a cada 40 matrículas','regiao':'Região de operação','cliente_id':'Identificador sintético de cliente; recorrente','produto_id':'Identificador sintético de produto; recorrente'}
catalog=[]
for key,name,category,desc,level,kpis,analyses in details:
    df=pd.DataFrame(rows[key])
    quality=[]
    if key=='atendimento': quality=['24 avaliações ausentes intencionalmente (sem resposta).','3 canais com espaço final para exercícios de normalização.']; df.loc[[20,40,60],'canal']=df.loc[[20,40,60],'canal']+' '
    if key=='educacao': quality=['15 notas ausentes intencionalmente para exercícios de limpeza.']
    if args.dataset is None or args.dataset == key:
        df.to_csv(OUT/f'{key}.csv',index=False,encoding='utf-8-sig')
        df.to_excel(OUT/f'{key}.xlsx',index=False,sheet_name='Dados')
    dictionary=[dict(name=c,type='número' if pd.api.types.is_numeric_dtype(df[c]) else 'texto / data',description=descriptions.get(c,c.replace('_',' ').capitalize()+'; dado fictício')) for c in df.columns]
    catalog.append(dict(id=f'dataset-{key}',slug=key,name=name,category=category,description=desc,difficulty=level,rows=len(df),columns=len(df.columns),dictionary=dictionary,kpis=kpis,analyses=analyses,quality=quality,preview=json.loads(df.head(8).to_json(orient='records',force_ascii=False)),tags=[category,'CSV','Excel'],createdAt='2026-11-04'))
(ROOT/'src/data').mkdir(parents=True,exist_ok=True)
(ROOT/'src/data/datasets.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'{args.dataset or str(len(catalog)) + " datasets"}, {N} linhas por base; CSV e XLSX gerados em {OUT}')
