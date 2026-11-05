import { Link } from "react-router-dom";
import { Icon } from "../components/common/UI";
import { allResources } from "../data/catalog";
export default function About() {
  return (
    <div className="page about-page">
      <div className="breadcrumbs">
        <Link to="/">Visão geral</Link>
        <Icon name="ChevronRight" size={13} />
        <span>Sobre o projeto</span>
      </div>
      <span className="eyebrow">FEITO PARA A COMUNIDADE</span>
      <h1>
        Dados abrem possibilidades<span>.</span>
      </h1>
      <p className="about-lead">Nós ajudamos você a dar o primeiro passo.</p>
      <div className="about-hero">
        <Icon name="ChartNoAxesColumnIncreasing" size={60} />
        <h2>DataViz Hub</h2>
        <p>Tudo o que você precisa para transformar dados em decisões.</p>
      </div>
      <div className="about-content">
        <h2>Um bom ponto de partida faz a diferença</h2>
        <p>
          O DataViz Hub é uma biblioteca gratuita e pública para quem trabalha
          com Análise de Dados, BI, Power BI, Python, SQL e Excel. Reunimos{" "}
          {allResources.length} recursos no catálogo local para economizar tempo
          e ampliar seu repertório.
        </p>
        <h2>Recursos originais, dados fictícios</h2>
        <p>
          Os modelos são composições originais com React e Recharts. Todos os
          datasets são sintéticos e reproduzíveis; não incluem dados pessoais
          reais. Os gráficos de referência e do construtor usam séries
          demonstrativas e não se conectam automaticamente aos datasets.
        </p>
        <h2>Sem login. Sem serviços pagos.</h2>
        <p>
          Favoritos, tema, paletas, rascunho do construtor e visualizações de
          dashboards ficam neste navegador. Limpar os dados do navegador apaga
          esse estado. Exporte seu projeto em JSON para guardá-lo.
        </p>
        <h2>Licenças e atribuições</h2>
        <p>
          Código original, modelos, fundos e datasets: MIT. Ícones: Lucide,
          licença ISC. Fonte: Inter, SIL Open Font License. Consulte
          THIRD_PARTY_NOTICES.md no repositório para as dependências.
        </p>
        <h2>Use como referência, aprenda e adapte</h2>
        <p>
          Os exemplos DAX dependem dos modelos e relacionamentos descritos em
          cada recurso. SQL informa o dialeto. A plataforma não executa códigos
          importados. Não há exportação PBIX; os downloads do construtor são PNG
          e JSON próprio.
        </p>
        <Link className="button primary" to="/dashboards">
          Encontre sua próxima inspiração <Icon name="ArrowRight" size={17} />
        </Link>
      </div>
    </div>
  );
}
