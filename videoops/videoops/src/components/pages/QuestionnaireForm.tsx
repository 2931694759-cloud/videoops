"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { makeId, nowIso, toIsoDate } from "@/lib/runtime";

const BRAND_RED = "#ef4444";
const MODAL_BLUE = "#1782ff";
const PAGE_BG = "linear-gradient(180deg, #eef3f8 0%, #cfd9e7 100%)";
const SURFACE_BG = "#f6f4ee";
const CARD_BG = "#fffefb";
const CARD_BORDER = "rgba(15, 23, 42, 0.08)";
const TEXT_MAIN = "#111827";
const TEXT_SUB = "#6b7280";
const PLACEHOLDER = "#9ca3af";
const ERROR = "#dc2626";

const DELIVERABLE_TYPES = ["3D", "视频", "线下物料", "平面设计", "文案", "内容创意", "其他"] as const;
const PRIORITY_OPTIONS = ["High", "Medium", "Low"] as const;

type Mode = "modal" | "page";
type DeliverableType = typeof DELIVERABLE_TYPES[number];

interface DeliverableRow {
  id: string;
  quantity: string;
  content: string;
  size: string;
  format: string;
  usage: string;
  note: string;
}

interface UploadItem {
  id: string;
  name: string;
  sizeKb: number;
  file?: File;
  previewUrl?: string;
}

interface FormState {
  projectName: string;
  brandTeam: string;
  requesterName: string;
  priority: string;
  requestDate: string;
  deadline: string;
  objective: string;
  keyMessage: string;
  targetAudience: string;
  touchPoints: string;
  mustInclude: string;
  stylePreference: string;
  tone: string;
  doNots: string;
  supportMaterialLink: string;
  selectedDeliverables: DeliverableType[];
  deliverables: Record<DeliverableType, DeliverableRow[]>;
}

type FieldKey =
  | "projectName"
  | "brandTeam"
  | "requesterName"
  | "priority"
  | "requestDate"
  | "deadline"
  | "objective"
  | "keyMessage"
  | "targetAudience"
  | "touchPoints"
  | "selectedDeliverables"
  | "mustInclude"
  | "stylePreference"
  | "tone";

function normalizeFormData(initialData?: Partial<FormState>): FormState {
  const base = createInitialForm();
  if (!initialData) return base;
  return {
    ...base,
    ...initialData,
    selectedDeliverables: initialData.selectedDeliverables ? [...initialData.selectedDeliverables] : base.selectedDeliverables,
    deliverables: {
      ...base.deliverables,
      ...(initialData.deliverables || {}),
    },
  };
}

function normalizeFiles(initialFiles?: Array<{ name: string; sizeKb: number; previewUrl?: string }>): UploadItem[] {
  return (initialFiles || []).map(file => ({
    id: `${file.name}-${file.sizeKb}`,
    name: file.name,
    sizeKb: file.sizeKb,
    previewUrl: file.previewUrl,
  }));
}

function createDeliverableRow(): DeliverableRow {
  return {
    id: makeId("deliverable-row"),
    quantity: "",
    content: "",
    size: "",
    format: "",
    usage: "",
    note: "",
  };
}

function createInitialForm(): FormState {
  return {
    projectName: "",
    brandTeam: "",
    requesterName: "",
    priority: "",
    requestDate: "",
    deadline: "",
    objective: "",
    keyMessage: "",
    targetAudience: "",
    touchPoints: "",
    mustInclude: "",
    stylePreference: "",
    tone: "",
    doNots: "",
    supportMaterialLink: "",
    selectedDeliverables: [],
    deliverables: {
      "3D": [],
      "视频": [],
      "线下物料": [],
      "平面设计": [],
      "文案": [],
      "内容创意": [],
      "其他": [],
    },
  };
}

function isDeliverableRowFilled(row: DeliverableRow) {
  return [row.quantity, row.content, row.size, row.format, row.usage, row.note].some(value => value.trim());
}

function hasAnyContent(form: FormState, files: UploadItem[]) {
  if (files.length > 0) return true;
  if (form.selectedDeliverables.length > 0) return true;
  if (Object.values(form.deliverables).some(rows => rows.some(isDeliverableRowFilled))) return true;
  return Object.entries(form).some(([key, value]) => {
    if (key === "selectedDeliverables" || key === "deliverables") return false;
    return typeof value === "string" && value.trim().length > 0;
  });
}

function MixLogo() {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", position: "relative", width: 68, height: 34 }}>
      <span style={{ position: "absolute", left: 3, top: 8, fontSize: 17, fontWeight: 900, color: "#111827", letterSpacing: "-0.5px" }}>The</span>
      <span style={{ position: "absolute", left: 28, top: 8, fontSize: 17, fontWeight: 900, color: "#111827", letterSpacing: "-0.5px" }}>MIX</span>
      <span style={{ position: "absolute", left: 36, top: -1, width: 21, height: 21, borderRadius: "50%", background: "#ef4444", opacity: 0.92 }} />
      <span style={{ position: "absolute", left: 46, top: 5, width: 13, height: 13, borderRadius: "50%", background: "#f97316", opacity: 0.9 }} />
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ height: 38, display: "flex", alignItems: "center", padding: "0 16px", borderRadius: "10px 10px 0 0", background: MODAL_BLUE, color: "#ffffff", fontSize: 12, fontWeight: 700 }}>
      {title}
    </div>
  );
}

function SectionBody({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderTop: "none", borderRadius: "0 0 12px 12px", padding: 16 }}>
      {children}
    </div>
  );
}

function FieldError({ text }: { text?: string }) {
  if (!text) return <div style={{ minHeight: 16, marginTop: 6 }} />;
  return <div style={{ minHeight: 16, marginTop: 6, fontSize: 12, color: ERROR, lineHeight: 1.3 }}>{text}</div>;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 18 }}>
      <SectionHeader title={title} />
      <SectionBody>{children}</SectionBody>
    </section>
  );
}

function RadioButton({
  label,
  checked,
  onClick,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "none", padding: 0, cursor: disabled ? "default" : "pointer", fontSize: 12, color: TEXT_MAIN, opacity: disabled ? 0.95 : 1 }}
    >
      <span style={{ width: 12, height: 12, borderRadius: "50%", border: `1px solid ${checked ? BRAND_RED : "#cbd5e1"}`, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: checked ? BRAND_RED : "transparent" }} />
      </span>
      {label}
    </button>
  );
}

function DeliverableChip({
  label,
  checked,
  onClick,
  disabled = false,
}: {
  label: DeliverableType;
  checked: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 30,
        padding: "0 12px",
        borderRadius: 8,
        border: `1px solid ${checked ? "rgba(239,68,68,0.45)" : "#d7dce4"}`,
        background: checked ? "rgba(239,68,68,0.10)" : "#ffffff",
        color: checked ? BRAND_RED : "#374151",
        fontSize: 12,
        fontWeight: 600,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.95 : 1,
      }}
    >
      {label}
    </button>
  );
}

export default function QuestionnaireForm({
  mode = "page",
  onBack,
  onCancel,
  onSubmitted,
  initialData,
  initialFiles,
  readonly = false,
  headerTitle,
}: {
  mode?: Mode;
  onBack?: () => void;
  onCancel?: () => void;
  onSubmitted?: () => void;
  initialData?: Partial<FormState>;
  initialFiles?: Array<{ name: string; sizeKb: number; previewUrl?: string }>;
  readonly?: boolean;
  headerTitle?: string;
}) {
  const addQuestionnaire = useStore(s => s.addQuestionnaire);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const fieldRefs = useRef<Partial<Record<FieldKey, HTMLElement | null>>>({});
  const normalizedInitialData = useMemo(() => normalizeFormData(initialData), [initialData]);
  const normalizedInitialFiles = useMemo(() => normalizeFiles(initialFiles), [initialFiles]);

  const [submitted, setSubmitted] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<UploadItem[]>(normalizedInitialFiles);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [form, setForm] = useState<FormState>(normalizedInitialData);

  const isModal = mode === "modal";
  const isReadonly = readonly;
  const closeHandler = onCancel || onBack;
  const isDirty = useMemo(() => isReadonly ? false : hasAnyContent(form, files), [files, form, isReadonly]);

  const attemptClose = () => {
    if (!isReadonly && isDirty && !window.confirm("当前表单尚未提交，关闭后已填写内容将丢失，是否确认关闭？")) {
      return;
    }
    closeHandler?.();
  };

  useEffect(() => {
    if (!isModal) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        attemptClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  });

  const registerField = (key: FieldKey) => (node: HTMLElement | null) => {
    fieldRefs.current[key] = node;
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    if (isReadonly) return;
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key as FieldKey]) {
      setErrors(prev => ({ ...prev, [key as FieldKey]: undefined }));
    }
  };

  const updateDeliverableRow = (type: DeliverableType, rowId: string, key: keyof DeliverableRow, value: string) => {
    if (isReadonly) return;
    setForm(prev => ({
      ...prev,
      deliverables: {
        ...prev.deliverables,
        [type]: prev.deliverables[type].map(row => row.id === rowId ? { ...row, [key]: value } : row),
      },
    }));
  };

  const toggleDeliverableType = (type: DeliverableType) => {
    if (isReadonly) return;
    setForm(prev => {
      const exists = prev.selectedDeliverables.includes(type);
      return {
        ...prev,
        selectedDeliverables: exists
          ? prev.selectedDeliverables.filter(item => item !== type)
          : [...prev.selectedDeliverables, type],
        deliverables: {
          ...prev.deliverables,
          [type]: exists ? [] : [createDeliverableRow()],
        },
      };
    });
    setErrors(prev => ({ ...prev, selectedDeliverables: undefined }));
  };

  const addDeliverableRow = (type: DeliverableType) => {
    if (isReadonly) return;
    setForm(prev => ({
      ...prev,
      deliverables: {
        ...prev.deliverables,
        [type]: [...prev.deliverables[type], createDeliverableRow()],
      },
    }));
  };

  const removeDeliverableRow = (type: DeliverableType, rowId: string) => {
    if (isReadonly) return;
    setForm(prev => ({
      ...prev,
      deliverables: {
        ...prev.deliverables,
        [type]: prev.deliverables[type].filter(row => row.id !== rowId),
      },
    }));
  };

  const handleFiles = (list: FileList | null) => {
    if (isReadonly) return;
    if (!list) return;
    const next = Array.from(list).map(file => ({ id: makeId("upload"), name: file.name, sizeKb: Math.max(1, Math.round(file.size / 1024)), file }));
    setFiles(prev => [...prev, ...next]);
  };

  const removeFile = (id: string) => {
    if (isReadonly) return;
    setFiles(prev => prev.filter(item => item.id !== id));
  };

  const previewFile = (file: File) => {
    const url = URL.createObjectURL(file);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const previewUpload = (item: UploadItem) => {
    if (item.file) {
      previewFile(item.file);
      return;
    }
    if (item.previewUrl) {
      window.open(item.previewUrl, "_blank", "noopener,noreferrer");
    }
  };

  const resetForm = () => {
    setForm(createInitialForm());
    setFiles([]);
    setErrors({});
    setDragOver(false);
  };

  const validate = () => {
    const nextErrors: Partial<Record<FieldKey, string>> = {};
    const requiredMap: Array<[FieldKey, string]> = [
      ["projectName", "请输入项目名称"],
      ["brandTeam", "请输入品牌 / 团队"],
      ["requesterName", "请输入需求人"],
      ["priority", "请选择优先级"],
      ["requestDate", "请选择需求日期"],
      ["deadline", "请选择截止日期"],
      ["objective", "请输入目标"],
      ["keyMessage", "请输入核心信息"],
      ["targetAudience", "请输入目标受众"],
      ["touchPoints", "请输入触点"],
    ];

    for (const [key, message] of requiredMap) {
      const value = form[key];
      if (typeof value === "string" && !value.trim()) nextErrors[key] = message;
    }

    if (!form.selectedDeliverables.length) {
      nextErrors.selectedDeliverables = "请至少选择一种交付物类型";
    }

    if (form.requestDate && form.deadline && new Date(form.deadline).getTime() < new Date(form.requestDate).getTime()) {
      nextErrors.deadline = "截止日期不能早于需求日期";
    }

    return nextErrors;
  };

  const focusFirstError = (nextErrors: Partial<Record<FieldKey, string>>) => {
    const fieldOrder: FieldKey[] = [
      "projectName",
      "brandTeam",
      "requesterName",
      "priority",
      "requestDate",
      "deadline",
      "objective",
      "keyMessage",
      "targetAudience",
      "touchPoints",
      "selectedDeliverables",
      "mustInclude",
      "stylePreference",
      "tone",
    ];

    const firstKey = fieldOrder.find(key => !!nextErrors[key]);
    if (!firstKey) return;
    const target = fieldRefs.current[firstKey];
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    if ("focus" in target && typeof target.focus === "function") {
      window.setTimeout(() => target.focus(), 120);
    }
  };

  const buildPayload = () => {
    const deliverableTypes = form.selectedDeliverables
      .map(type => ({
        type,
        items: form.deliverables[type]
          .filter(isDeliverableRowFilled)
          .map(row => ({
            name: row.content.trim() || row.note.trim(),
            quantity: Number(row.quantity.trim()) > 0 ? Number(row.quantity.trim()) : 1,
            size: row.size.trim(),
            outputFormat: row.format.trim(),
            usageScenario: row.usage.trim(),
            remark: row.note.trim(),
          }))
      }))
      .filter(group => group.items.length > 0);

    const mergedDeliverableTypes = Array.from(
      deliverableTypes.reduce((acc, group) => {
        const current = acc.get(group.type) || [];
        acc.set(group.type, [...current, ...group.items]);
        return acc;
      }, new Map<DeliverableType, typeof deliverableTypes[number]["items"]>())
    ).map(([type, items]) => ({ type, items }));

    const deliverables = Object.fromEntries(
      mergedDeliverableTypes.map(group => [
        group.type,
        group.items.map(item => ({
          quantity: String(item.quantity || 1),
          content: item.name,
          size: item.size,
          format: item.outputFormat,
          usage: item.usageScenario,
          note: item.remark,
          name: item.name,
          outputFormat: item.outputFormat,
          usageScenario: item.usageScenario,
          remark: item.remark,
        })),
      ])
    );

    const objectiveSummary = form.objective.trim().slice(0, 140);

    return {
      id: makeId("q"),
      title: form.projectName.trim(),
      // 列表「需求描述」映射规则：使用「目标」摘要
      description: objectiveSummary,
      videoType: "OTHER",
      duration: "-",
      deadline: toIsoDate(form.deadline),
      requesterName: form.requesterName.trim(),
      requesterEmail: "",
      requesterDept: null,
      deliverableTypes: mergedDeliverableTypes,
      specialNotes: JSON.stringify({
        brand: form.brandTeam.trim(),
        priority: form.priority,
        requestDate: form.requestDate,
        objective: form.objective.trim(),
        keyMessage: form.keyMessage.trim(),
        targetAudience: form.targetAudience.trim(),
        touchPoints: form.touchPoints.trim(),
        mustInclude: form.mustInclude.trim(),
        stylePreference: form.stylePreference.trim(),
        tone: form.tone.trim(),
        doNots: form.doNots.trim(),
        supportMaterialLink: form.supportMaterialLink.trim(),
        deliverableTypes: mergedDeliverableTypes,
        deliverables,
        uploadedFiles: files.flatMap(item => {
          if (!item.file) return [];
          return [{
            name: item.file.name,
            sizeKb: Math.max(1, Math.round(item.file.size / 1024)),
          }];
        }),
      }),
      status: "PENDING",
      claimedById: null,
      assignedById: null,
      createdAt: nowIso(),
    };
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isReadonly) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstError(nextErrors);
      return;
    }

    addQuestionnaire(buildPayload());
    resetForm();

    if (isModal) {
      onSubmitted?.();
      closeHandler?.();
      return;
    }

    if (onSubmitted) {
      onSubmitted();
      return;
    }

    setSubmitted(true);
  };

  const inputStyle = {
    width: "100%",
    height: 36,
    padding: "0 12px",
    backgroundColor: "#ffffff",
    border: "1px solid #d8dee7",
    borderRadius: 6,
    fontSize: 12,
    color: TEXT_MAIN,
    outline: "none",
    boxShadow: "inset 0 1px 2px rgba(15, 23, 42, 0.03)",
  };
  const readonlyInputStyle = isReadonly
    ? {
        backgroundColor: "#f8fafc",
        color: "#475569",
        cursor: "default",
      }
    : {};
  const textareaStyle = {
    ...inputStyle,
    height: "auto" as const,
    minHeight: 92,
    padding: "10px 12px",
    resize: "vertical" as const,
    lineHeight: 1.6,
  };
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 700 as const, color: TEXT_MAIN, marginBottom: 6 };
  const requiredStar = <span style={{ color: BRAND_RED, marginLeft: 1 }}>*</span>;

  const formBody = (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div ref={bodyRef} style={{ flex: 1, overflowY: "auto", padding: isModal ? "0 18px 20px" : "0 0 22px" }}>
        <div style={{ width: "100%", maxWidth: 760, margin: "0 auto" }}>
          <div style={{ textAlign: "center", padding: isModal ? "8px 18px 18px" : "4px 18px 18px" }}>
            <MixLogo />
            <h1 style={{ marginTop: 10, fontSize: 20, fontWeight: 900, color: TEXT_MAIN, letterSpacing: "-0.4px" }}>
              TheMIX Studio Creative Brief Request
            </h1>
            <p style={{ marginTop: 8, fontSize: 11, lineHeight: 1.6, color: TEXT_SUB, maxWidth: 620, marginInline: "auto" }}>
              本表单用于收集创意需求所需的核心背景信息。请尽可能完整地填写每一项，以便 Studio 团队准确理解目标、范围与交付要求。
            </p>
          </div>

          <Section title="项目概览">
            <div className="grid grid-cols-2 gap-[14px]">
              <div ref={registerField("projectName")}>
                <label style={labelStyle}>项目名称{requiredStar}</label>
                <input value={form.projectName} readOnly={isReadonly} onChange={e => setField("projectName", e.target.value)} style={{ ...inputStyle, ...readonlyInputStyle }} placeholder="请输入项目名称" />
                <FieldError text={errors.projectName} />
              </div>
              <div ref={registerField("brandTeam")}>
                <label style={labelStyle}>品牌 / 团队{requiredStar}</label>
                <input value={form.brandTeam} readOnly={isReadonly} onChange={e => setField("brandTeam", e.target.value)} style={{ ...inputStyle, ...readonlyInputStyle }} placeholder="请输入品牌或团队" />
                <FieldError text={errors.brandTeam} />
              </div>
              <div ref={registerField("requesterName")}>
                <label style={labelStyle}>需求人{requiredStar}</label>
                <input value={form.requesterName} readOnly={isReadonly} onChange={e => setField("requesterName", e.target.value)} style={{ ...inputStyle, ...readonlyInputStyle }} placeholder="请输入需求人" />
                <FieldError text={errors.requesterName} />
              </div>
              <div ref={registerField("priority")}>
                <label style={labelStyle}>优先级{requiredStar}</label>
                <div style={{ ...inputStyle, display: "flex", alignItems: "center", gap: 18, height: 36 }}>
                  {PRIORITY_OPTIONS.map(option => (
                    <RadioButton key={option} label={option} checked={form.priority === option} disabled={isReadonly} onClick={() => setField("priority", option)} />
                  ))}
                </div>
                <FieldError text={errors.priority} />
              </div>
              <div ref={registerField("requestDate")}>
                <label style={labelStyle}>需求日期{requiredStar}</label>
                <input type="date" value={form.requestDate} readOnly={isReadonly} onChange={e => setField("requestDate", e.target.value)} style={{ ...inputStyle, ...readonlyInputStyle }} />
                <FieldError text={errors.requestDate} />
              </div>
              <div ref={registerField("deadline")}>
                <label style={labelStyle}>截止日期{requiredStar}</label>
                <input type="date" value={form.deadline} readOnly={isReadonly} onChange={e => setField("deadline", e.target.value)} style={{ ...inputStyle, ...readonlyInputStyle }} />
                <FieldError text={errors.deadline} />
              </div>
            </div>
          </Section>

          <Section title="背景信息">
            <div className="grid grid-cols-2 gap-[14px]">
              <div ref={registerField("objective")}>
                <label style={labelStyle}>目标{requiredStar}</label>
                <textarea value={form.objective} readOnly={isReadonly} onChange={e => setField("objective", e.target.value)} style={{ ...textareaStyle, ...readonlyInputStyle }} placeholder="请填写本次项目目标、要解决的问题或希望达成的业务结果" />
                <FieldError text={errors.objective} />
              </div>
              <div ref={registerField("keyMessage")}>
                <label style={labelStyle}>核心信息{requiredStar}</label>
                <textarea value={form.keyMessage} readOnly={isReadonly} onChange={e => setField("keyMessage", e.target.value)} style={{ ...textareaStyle, ...readonlyInputStyle }} placeholder="请填写想向受众传递的核心信息或关键卖点" />
                <FieldError text={errors.keyMessage} />
              </div>
              <div ref={registerField("targetAudience")}>
                <label style={labelStyle}>目标受众{requiredStar}</label>
                <textarea value={form.targetAudience} readOnly={isReadonly} onChange={e => setField("targetAudience", e.target.value)} style={{ ...textareaStyle, ...readonlyInputStyle }} placeholder="请描述目标受众画像、圈层或使用场景" />
                <FieldError text={errors.targetAudience} />
              </div>
              <div ref={registerField("touchPoints")}>
                <label style={labelStyle}>触点{requiredStar}</label>
                <textarea value={form.touchPoints} readOnly={isReadonly} onChange={e => setField("touchPoints", e.target.value)} style={{ ...textareaStyle, ...readonlyInputStyle }} placeholder="请填写传播触点、投放平台、线下场景或使用渠道" />
                <FieldError text={errors.touchPoints} />
              </div>
            </div>
          </Section>

          <Section title="交付物清单">
            <div ref={registerField("selectedDeliverables")}>
              <label style={labelStyle}>交付物类型{requiredStar}</label>
              <div className="flex flex-wrap gap-[8px]">
                {DELIVERABLE_TYPES.map(type => (
                  <DeliverableChip
                    key={type}
                    label={type}
                    checked={form.selectedDeliverables.includes(type)}
                    disabled={isReadonly}
                    onClick={() => toggleDeliverableType(type)}
                  />
                ))}
              </div>
              <FieldError text={errors.selectedDeliverables} />
            </div>

            {form.selectedDeliverables.length === 0 ? (
              <div style={{ marginTop: 10, borderRadius: 8, border: "1px dashed #d5dbe6", background: "#fbfcff", padding: "14px 12px", textAlign: "center", fontSize: 12, color: PLACEHOLDER }}>
                勾选交付物类型后，将在此处显示对应明细表格。
              </div>
            ) : (
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
                {form.selectedDeliverables.map(type => (
                  <div key={type} style={{ border: "1px solid #dfe4ec", borderRadius: 10, overflow: "hidden", background: "#ffffff" }}>
                    <div className="flex items-center justify-between" style={{ padding: "10px 12px", background: "#f8fbff", borderBottom: "1px solid #e5ebf3" }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: TEXT_MAIN }}>{type}</div>
                      {!isReadonly && (
                        <button
                          type="button"
                          onClick={() => addDeliverableRow(type)}
                          style={{ height: 28, padding: "0 10px", borderRadius: 7, border: "1px solid rgba(23,130,255,0.20)", background: "rgba(23,130,255,0.08)", color: MODAL_BLUE, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                        >
                          + 新增一行
                        </button>
                      )}
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", minWidth: 980, borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "#fbfcfe" }}>
                            {["交付物数量", "内容说明", "尺寸规格", "输出格式", "使用场景", "备注", ...(isReadonly ? [] : ["操作"])].map(text => (
                              <th key={text} style={{ padding: "10px 10px", borderBottom: "1px solid #edf1f6", fontSize: 11, fontWeight: 700, color: "#64748b", textAlign: "left" }}>
                                {text}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {form.deliverables[type].map(row => (
                            <tr key={row.id}>
                              <td style={{ padding: 10, borderBottom: "1px solid #f0f3f8", width: 120 }}>
                                <input value={row.quantity} readOnly={isReadonly} onChange={e => updateDeliverableRow(type, row.id, "quantity", e.target.value)} style={{ ...inputStyle, ...readonlyInputStyle, height: 34 }} placeholder="例：2" />
                              </td>
                              <td style={{ padding: 10, borderBottom: "1px solid #f0f3f8", width: 220 }}>
                                <input value={row.content} readOnly={isReadonly} onChange={e => updateDeliverableRow(type, row.id, "content", e.target.value)} style={{ ...inputStyle, ...readonlyInputStyle, height: 34 }} placeholder="内容说明" />
                              </td>
                              <td style={{ padding: 10, borderBottom: "1px solid #f0f3f8", width: 160 }}>
                                <input value={row.size} readOnly={isReadonly} onChange={e => updateDeliverableRow(type, row.id, "size", e.target.value)} style={{ ...inputStyle, ...readonlyInputStyle, height: 34 }} placeholder="尺寸规格" />
                              </td>
                              <td style={{ padding: 10, borderBottom: "1px solid #f0f3f8", width: 150 }}>
                                <input value={row.format} readOnly={isReadonly} onChange={e => updateDeliverableRow(type, row.id, "format", e.target.value)} style={{ ...inputStyle, ...readonlyInputStyle, height: 34 }} placeholder="输出格式" />
                              </td>
                              <td style={{ padding: 10, borderBottom: "1px solid #f0f3f8", width: 180 }}>
                                <input value={row.usage} readOnly={isReadonly} onChange={e => updateDeliverableRow(type, row.id, "usage", e.target.value)} style={{ ...inputStyle, ...readonlyInputStyle, height: 34 }} placeholder="使用场景" />
                              </td>
                              <td style={{ padding: 10, borderBottom: "1px solid #f0f3f8", width: 180 }}>
                                <input value={row.note} readOnly={isReadonly} onChange={e => updateDeliverableRow(type, row.id, "note", e.target.value)} style={{ ...inputStyle, ...readonlyInputStyle, height: 34 }} placeholder="备注" />
                              </td>
                              {!isReadonly && (
                                <td style={{ padding: 10, borderBottom: "1px solid #f0f3f8", width: 74 }}>
                                  <button
                                    type="button"
                                    onClick={() => removeDeliverableRow(type, row.id)}
                                    disabled={form.deliverables[type].length <= 1}
                                    style={{ height: 30, width: "100%", borderRadius: 7, border: "1px solid #e5e7eb", background: "#fff", color: form.deliverables[type].length <= 1 ? "#cbd5e1" : "#6b7280", fontSize: 12, cursor: form.deliverables[type].length <= 1 ? "not-allowed" : "pointer" }}
                                  >
                                    删除
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="创意方向">
            <div className="grid grid-cols-2 gap-[14px]">
              <div ref={registerField("mustInclude")}>
                <label style={labelStyle}>必须包含</label>
                <textarea value={form.mustInclude} readOnly={isReadonly} onChange={e => setField("mustInclude", e.target.value)} style={{ ...textareaStyle, ...readonlyInputStyle }} placeholder="请填写品牌元素、Logo、文案、产品信息等必须出现的内容" />
                <FieldError text={errors.mustInclude} />
              </div>
              <div ref={registerField("stylePreference")}>
                <label style={labelStyle}>设计风格偏好</label>
                <textarea value={form.stylePreference} readOnly={isReadonly} onChange={e => setField("stylePreference", e.target.value)} style={{ ...textareaStyle, ...readonlyInputStyle }} placeholder="请填写希望的视觉风格、参考方向或案例关键词" />
                <FieldError text={errors.stylePreference} />
              </div>
              <div ref={registerField("tone")}>
                <label style={labelStyle}>语气与调性</label>
                <textarea value={form.tone} readOnly={isReadonly} onChange={e => setField("tone", e.target.value)} style={{ ...textareaStyle, ...readonlyInputStyle }} placeholder="请填写语气、情绪、调性，例如专业、克制、年轻、轻松等" />
                <FieldError text={errors.tone} />
              </div>
              <div>
                <label style={labelStyle}>禁止事项</label>
                <textarea value={form.doNots} readOnly={isReadonly} onChange={e => setField("doNots", e.target.value)} style={{ ...textareaStyle, ...readonlyInputStyle }} placeholder="请填写禁用视觉元素、措辞、禁区或不希望出现的表达" />
                <FieldError />
              </div>
            </div>
          </Section>

          <Section title="支持材料">
            <div
              style={{ border: `1.5px dashed ${dragOver ? "rgba(239,68,68,0.5)" : "#d5dbe6"}`, borderRadius: 10, background: dragOver ? "rgba(239,68,68,0.04)" : "#fcfdff", padding: "24px 18px", textAlign: "center", transition: "all 0.2s", cursor: isReadonly ? "default" : "pointer" }}
              onClick={() => {
                if (!isReadonly) fileInputRef.current?.click();
              }}
              onDragOver={event => {
                if (isReadonly) return;
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={event => {
                if (isReadonly) return;
                event.preventDefault();
                setDragOver(false);
                handleFiles(event.dataTransfer.files);
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: "50%", margin: "0 auto 10px", background: "rgba(239,68,68,0.10)", display: "flex", alignItems: "center", justifyContent: "center", color: BRAND_RED }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_MAIN }}>将文件拖拽到此处，或点击上传</div>
              <div style={{ marginTop: 6, fontSize: 11, color: TEXT_SUB }}>支持 PDF、PPT、JPG、PNG、MP4、MOV、ZIP 等常见格式</div>
              {!isReadonly && (
                <button
                  type="button"
                  onClick={event => {
                    event.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  style={{ marginTop: 12, height: 30, padding: "0 16px", borderRadius: 6, border: "none", background: BRAND_RED, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  上传文件
                </button>
              )}
              {!isReadonly && <input ref={fileInputRef} type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />}
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={labelStyle}>支持材料链接</label>
              <div style={{ position: "relative" }}>
                <input value={form.supportMaterialLink} readOnly={isReadonly} onChange={e => setField("supportMaterialLink", e.target.value)} style={{ ...inputStyle, ...readonlyInputStyle, paddingRight: 34 }} placeholder="如果文件过大，您可以在此附上文件链接" />
                <span style={{ position: "absolute", right: 11, top: 11, color: "#94a3b8", fontSize: 12 }}>🔗</span>
              </div>
            </div>

            <div style={{ marginTop: 14, border: "1px solid #e5eaf1", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.8fr 0.7fr 0.8fr", background: "#f8fbff", borderBottom: "1px solid #e8edf3", padding: "10px 12px", fontSize: 11, fontWeight: 700, color: "#64748b" }}>
                <div>文件名</div>
                <div>文件大小</div>
                <div style={{ textAlign: "right" }}>操作</div>
              </div>
              {files.length === 0 ? (
                <div style={{ padding: "18px 12px", textAlign: "center", fontSize: 12, color: PLACEHOLDER, background: "#ffffff" }}>暂未上传文件</div>
              ) : (
                files.map(item => (
                  <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1.8fr 0.7fr 0.8fr", alignItems: "center", padding: "11px 12px", borderTop: "1px solid #f1f4f8", background: "#ffffff", fontSize: 12, color: TEXT_MAIN }}>
                    <div className="truncate">{item.name}</div>
                    <div>{item.sizeKb} KB</div>
                    <div className="flex items-center justify-end gap-[8px]">
                      <button type="button" onClick={() => previewUpload(item)} style={{ border: "none", background: "transparent", color: MODAL_BLUE, cursor: item.file || item.previewUrl ? "pointer" : "default", fontSize: 12, fontWeight: 700, opacity: item.file || item.previewUrl ? 1 : 0.45 }} disabled={!item.file && !item.previewUrl}>
                        查看
                      </button>
                      {!isReadonly && (
                        <button type="button" onClick={() => removeFile(item.id)} style={{ border: "none", background: "transparent", color: BRAND_RED, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                          删除
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Section>

        </div>
      </div>

      <div style={{ padding: isModal ? "14px 18px 18px" : "0 0 4px", borderTop: isModal ? "1px solid rgba(15,23,42,0.08)" : "none", background: isModal ? CARD_BG : "transparent" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", justifyContent: "center", gap: 12 }}>
          <button
            type="button"
            onClick={attemptClose}
            style={{ minWidth: 110, height: 38, borderRadius: 8, border: "1px solid #d8dee7", background: "#fff", color: TEXT_MAIN, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            {isReadonly ? "关闭" : "取消"}
          </button>
          {!isReadonly && (
            <button
              type="submit"
              style={{ minWidth: 122, height: 38, borderRadius: 8, border: "none", background: "linear-gradient(180deg, #2188ff 0%, #0d74ef 100%)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: "0 10px 20px rgba(13,116,239,0.18)" }}
            >
              提交 Brief
            </button>
          )}
        </div>
      </div>
    </form>
  );

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: PAGE_BG, padding: "40px 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 420, background: "#fff", borderRadius: 20, border: `1px solid ${CARD_BORDER}`, padding: "36px 28px", textAlign: "center", boxShadow: "0 24px 70px rgba(15,23,42,0.12)" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(34,197,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", color: "#16a34a" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: TEXT_MAIN }}>Brief 已提交</h2>
          <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.7, color: TEXT_SUB }}>新记录已经写入需求分发中心，你可以继续提交新的 Brief。</p>
          <div className="flex items-center justify-center gap-[10px]" style={{ marginTop: 22 }}>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              style={{ height: 38, padding: "0 16px", borderRadius: 8, border: "1px solid #d8dee7", background: "#fff", color: TEXT_MAIN, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              再提交一份
            </button>
            <button
              type="button"
              onClick={() => closeHandler?.()}
              style={{ height: 38, padding: "0 16px", borderRadius: 8, border: "none", background: BRAND_RED, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center"
        style={{ background: "rgba(15, 23, 42, 0.42)", backdropFilter: "blur(4px)", padding: 16 }}
        onClick={attemptClose}
      >
        <div
          onClick={event => event.stopPropagation()}
          style={{
            width: "min(980px, calc(100vw - 32px))",
            maxHeight: "calc(100vh - 24px)",
            borderRadius: 22,
            background: SURFACE_BG,
            boxShadow: "0 30px 90px rgba(15, 23, 42, 0.24)",
            border: "1px solid rgba(255,255,255,0.65)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={{ height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px 0 18px", borderBottom: "1px solid rgba(15,23,42,0.08)", background: "rgba(255,255,255,0.56)" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: TEXT_MAIN }}>{headerTitle || "Brief 表单模板"}</div>
            <button
              type="button"
              onClick={attemptClose}
              style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid rgba(15,23,42,0.10)", background: "#fff", color: TEXT_SUB, cursor: "pointer", fontSize: 18, lineHeight: 1 }}
            >
              ×
            </button>
          </div>
          {formBody}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, padding: "28px 20px" }}>
      <div style={{ maxWidth: 980, margin: "0 auto", background: SURFACE_BG, borderRadius: 24, border: "1px solid rgba(255,255,255,0.68)", boxShadow: "0 24px 80px rgba(15,23,42,0.12)", padding: 20 }}>
        {formBody}
      </div>
    </div>
  );
}
