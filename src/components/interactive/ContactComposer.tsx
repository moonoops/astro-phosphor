import { useEffect } from "react";
import pageCopy from "../../data/page-copy.json";

const formCopy = pageCopy.contact.form;

interface Props {
  formId: string;
  recipient: string;
}

export default function ContactComposer({ formId, recipient }: Props) {
  useEffect(() => {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;

    const submit = form.querySelector<HTMLButtonElement>("button[type=submit]");
    const feedback = form.querySelector<HTMLElement>(".contact-feedback");
    const sender = form.elements.namedItem("sender");
    const message = form.elements.namedItem("message");
    if (!submit || !feedback || !(sender instanceof HTMLInputElement) || !(message instanceof HTMLTextAreaElement)) return;

    const clearCustomValidity = (event: Event) => {
      if (event.target === sender) sender.setCustomValidity("");
      if (event.target === message) message.setCustomValidity("");
      feedback.textContent = "";
    };

    const compose = (event: SubmitEvent) => {
      event.preventDefault();

      const senderName = sender.value.trim();
      const messageText = message.value;
      sender.setCustomValidity(senderName ? "" : formCopy.validation.name);
      message.setCustomValidity(messageText.trim() ? "" : formCopy.validation.message);
      if (!form.reportValidity()) return;

      const fields = new FormData(form);
      const email = String(fields.get("email")).trim();
      const subject = String(fields.get("topic"));
      const body = `${messageText}\n\n${formCopy.from.label}: ${senderName}\n${formCopy.email.label}: ${email}`.replace(/\r?\n/g, "\r\n");

      if (recipient) {
        const address = encodeURIComponent(recipient).replace("%40", "@");
        const mailto = `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        feedback.textContent = formCopy.feedback.mailApp;
        window.location.assign(mailto);
        return;
      }

      const blob = new Blob([`${formCopy.subjectLabel}: ${subject}\r\n\r\n${body}`], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "message-draft.txt";
      form.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      feedback.textContent = formCopy.feedback.localDrafts;
    };

    form.addEventListener("submit", compose);
    form.addEventListener("input", clearCustomValidity);
    submit.disabled = false;
    return () => {
      form.removeEventListener("submit", compose);
      form.removeEventListener("input", clearCustomValidity);
      submit.disabled = true;
    };
  }, [formId, recipient]);

  return null;
}
