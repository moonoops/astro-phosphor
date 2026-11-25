import { useId, useState } from "react";
import type { CSSProperties } from "react";
import pageCopy from "../../data/page-copy.json";
import PixelIcon from "../os/PixelIcon";

const { title, items: questions } = pageCopy.about.faq;

export default function FAQPanel() {
  const id = useId();
  const [selected, setSelected] = useState(0);

  return (
    <section className="information-section faq-panel" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{title}</h2>
      <ul className="faq-list" role="list" style={{ "--faq-count": questions.length } as CSSProperties}>
        {questions.map(({ question, answer }, index) => {
          const isSelected = selected === index;
          return (
            <li className="faq-item" role="listitem" key={index}>
              <button
                type="button"
                id={`${id}-question-${index}`}
                aria-controls={`${id}-answer-${index}`}
                aria-expanded={isSelected}
                onClick={() => setSelected(index)}
              >
                {question}
                <PixelIcon name="chevron" size={14} />
              </button>
              <div
                className="faq-answer"
                id={`${id}-answer-${index}`}
                role="region"
                aria-labelledby={`${id}-question-${index}`}
                hidden={!isSelected}
              >
                <p>{answer}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
