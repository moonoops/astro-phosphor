import { useId, useState } from "react";
import pageCopy from "../../data/page-copy.json";
import { formatCopy } from "../../site";
import PixelIcon from "../os/PixelIcon";
import ButtonBase from "../ui/ButtonBase";

const wizard = pageCopy.about.wizard;
const { steps } = wizard;

export default function SetupWizard() {
  const id = useId();
  const [selected, setSelected] = useState(0);
  const isLast = selected === steps.length - 1;

  return (
    <section className="information-section setup-wizard" aria-labelledby={`${id}-title`}>
      <div className="wizard-heading">
        <h2 id={`${id}-title`}>{wizard.title}</h2>
        <p className="wizard-count" role="status">{formatCopy(wizard.status, { step: selected + 1, total: steps.length })}</p>
      </div>
      <progress
        className="wizard-progress"
        aria-label={wizard.progressLabel}
        max={steps.length}
        value={selected + 1}
      />
      <ol className="wizard-steps" role="list">
        {steps.map((step, index) => {
          const isSelected = selected === index;
          return (
            <li className="wizard-step" role="listitem" key={index}>
              <button
                type="button"
                id={`${id}-step-${index}`}
                aria-controls={`${id}-panel-${index}`}
                aria-expanded={isSelected}
                onClick={() => setSelected(index)}
              >
                {step.label}
                <PixelIcon name="chevron" size={14} />
              </button>
              <div
                className="wizard-panel"
                id={`${id}-panel-${index}`}
                role="region"
                aria-labelledby={`${id}-step-${index}`}
                hidden={!isSelected}
              >
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="wizard-actions">
        <ButtonBase
          type="button"
          variant="secondary"
          disabled={selected === 0}
          onClick={() => setSelected(selected - 1)}
        >
          <PixelIcon name="back" size={16} /> {wizard.back}
        </ButtonBase>
        <ButtonBase
          type="button"
          variant="primary"
          disabled={isLast}
          onClick={() => setSelected(selected + 1)}
        >
          {wizard.next} <PixelIcon name="next" size={16} />
        </ButtonBase>
      </div>
    </section>
  );
}
