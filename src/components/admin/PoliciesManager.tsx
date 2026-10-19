"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import Icon from "@/components/Icon";
import { deletePolicy, savePolicy, type FormState } from "@/app/admin/(panel)/policies/actions";

type Policy = {
  id: string;
  service: string;
  title: string;
  body: string;
  sort_order: number;
  published: boolean;
  only_for_similar: boolean;
};

const box = "w-full border border-line bg-transparent px-3 py-2.5 text-sm focus:border-accent focus:outline-none";
const lab = "mb-1.5 block text-xs tracking-widest text-muted";
const primary =
  "bg-accent px-5 py-2.5 text-xs tracking-widest text-on-accent transition-opacity hover:opacity-90 disabled:opacity-50";
const quiet =
  "inline-flex items-center gap-2 border border-line px-4 py-2.5 text-xs tracking-widest text-muted transition-colors hover:border-accent hover:text-fg disabled:opacity-50";

function Status({ state }: { state: FormState }) {
  if (state.error)
    return (
      <p role="alert" className="text-sm underline decoration-accent underline-offset-4">
        {state.error}
      </p>
    );
  if (state.ok)
    return (
      <p role="status" className="inline-flex items-center gap-1.5 text-sm text-muted">
        <Icon name="check" size={14} /> Saved
      </p>
    );
  return null;
}

function PolicyForm({ service, policy }: { service: string; policy?: Policy }) {
  const uid = useId();
  const [state, action, pending] = useActionState<FormState, FormData>(savePolicy, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok && !policy) ref.current?.reset();
  }, [state, policy]);

  return (
    <form ref={ref} action={action} className="space-y-4">
      {policy && <input type="hidden" name="id" value={policy.id} />}
      <input type="hidden" name="service" value={service} />

      <div className="grid gap-4 sm:grid-cols-[1fr_6rem]">
        <div>
          <label htmlFor={`${uid}-t`} className={lab}>Title</label>
          <input id={`${uid}-t`} name="title" required maxLength={120} defaultValue={policy?.title} className={box} />
        </div>
        <div>
          <label htmlFor={`${uid}-o`} className={lab}>Order</label>
          <input id={`${uid}-o`} name="sort_order" type="number" defaultValue={policy?.sort_order ?? 0} className={box} />
        </div>
      </div>

      <div>
        <label htmlFor={`${uid}-b`} className={lab}>Text</label>
        <textarea id={`${uid}-b`} name="body" required rows={policy ? 6 : 5} maxLength={6000} defaultValue={policy?.body} className={box} />
        <p className="mt-1 text-xs text-muted">Blank lines make new paragraphs. Start a line with a bullet to make a list.</p>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={policy ? policy.published : true} className="h-4 w-4 accent-[var(--accent)]" />
          Shown to guests
        </label>
        {service === "ride" && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="only_for_similar" defaultChecked={policy?.only_for_similar ?? false} className="h-4 w-4 accent-[var(--accent)]" />
            Only on cars marked "or similar"
          </label>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button disabled={pending} className={primary}>
          {pending ? "Saving..." : policy ? "Save" : "Add policy"}
        </button>
        <Status state={state} />
      </div>
    </form>
  );
}

function RemoveForm({ id, title }: { id: string; title: string }) {
  const [state, run, pending] = useActionState<FormState, FormData>(deletePolicy, {});
  return (
    <form
      action={run}
      onSubmit={(e) => {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) e.preventDefault();
      }}
      className="flex flex-wrap items-center gap-3"
    >
      <input type="hidden" name="id" value={id} />
      <button disabled={pending} className={quiet}>
        <Icon name="trash" size={14} /> Delete this policy
      </button>
      {state.error && (
        <p role="alert" className="text-sm underline decoration-accent underline-offset-4">
          {state.error}
        </p>
      )}
    </form>
  );
}

export default function PoliciesManager({ service, policies }: { service: string; policies: Policy[] }) {
  return (
    <div className="space-y-4">
      {policies.length === 0 && <p className="text-sm text-muted">No policies yet. Add the first one below.</p>}

      {policies.map((p) => (
        <details key={p.id} className="group border border-line">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 [&::-webkit-details-marker]:hidden">
            <span className="flex min-w-0 items-center gap-3">
              <Icon name="policy" size={20} className="shrink-0" />
              <span className="min-w-0">
                <span className="block truncate text-sm">{p.title}</span>
                <span className="block truncate text-xs text-muted">
                  {p.published ? "Shown to guests" : "Hidden"}
                  {p.only_for_similar ? ", only on cars marked or similar" : ""}
                </span>
              </span>
            </span>
            <Icon name="chevron" size={18} className="shrink-0 transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="space-y-5 border-t border-line p-4">
            <PolicyForm service={service} policy={p} />
            <RemoveForm id={p.id} title={p.title} />
          </div>
        </details>
      ))}

      <details className="group border border-accent">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-3 text-sm">
            <Icon name="plus" size={20} className="shrink-0" />
            Add a policy
          </span>
          <Icon name="chevron" size={18} className="shrink-0 transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="border-t border-line p-4">
          <PolicyForm service={service} />
        </div>
      </details>
    </div>
  );
}
