import type { SpaceSpiderAnswer } from '../deepSearch/spiderTypes';
import './spaceWidgets.css';

type Props = { answer: SpaceSpiderAnswer };

export function SearchSourcesWidget({ answer }: Props) {
  return (
    <div className="space-widget space-search-widget">
      <div className="space-widget-kicker">Открытый интернет</div>
      <h3>{answer.title}</h3>
      <p>{answer.answer}</p>
      {answer.bullets.length > 0 && (
        <div className="space-widget-bullets">
          {answer.bullets.slice(0, 4).map((item) => (
            <div key={item} className="space-widget-bullet">{item}</div>
          ))}
        </div>
      )}
      <div className="space-source-row">
        {answer.sources.slice(0, 5).map((source) => (
          <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="space-source-pill">
            <span>{source.displayUrl || source.source || 'source'}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
