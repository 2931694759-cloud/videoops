"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { USERS } from "@/lib/mock-data";
import MemberCard from "./MemberCard";
import MemberModal from "./MemberModal";
import RightPanel from "./RightPanel";
import TeamFilters from "./TeamFilters";
import TeamHeader from "./TeamHeader";
import type { MemberProfile, MemberRoleFilter, MemberSortField, SortDirection, SkillTag } from "./teamTypes";
import { BORDER_WEAK, PAGE_BG, TEXT_MAIN } from "./teamUi";
import { pickAvatar, seedProfile } from "./teamLogic";
import { useTeamComputed } from "./useTeamComputed";

export default function TeamManagement({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { typeTaskPackages, projects, questionnaires, submissions, signoffRecords } = useStore();

  const [members, setMembers] = useState<MemberProfile[]>(() => USERS.map(seedProfile));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<"detail" | "tasks">("detail");

  const [roleFilter, setRoleFilter] = useState<MemberRoleFilter>("all");
  const [sortField, setSortField] = useState<MemberSortField>("currentTasks");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [search, setSearch] = useState("");

  const [toast, setToast] = useState("");
  const [modal, setModal] = useState<null | { mode: "add" | "edit"; memberId: string }>(null);

  const computed = useTeamComputed({
    members,
    typeTaskPackages,
    projects,
    questionnaires,
    submissions,
    signoffRecords,
    roleFilter,
    sortField,
    sortDirection,
    search,
    selectedId,
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const pickMember = (id: string) => {
    setSelectedId(id);
    setPanelMode("detail");
  };

  const toggleSort = (field: MemberSortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === "desc" ? "asc" : "desc"));
      return;
    }
    setSortField(field);
    setSortDirection("desc");
  };

  const openAdd = () => {
    const id = `u-${Date.now()}`;
    setModal({ mode: "add", memberId: id });
  };

  const openEdit = () => {
    if (!computed.selected) return;
    setModal({ mode: "edit", memberId: computed.selected.id });
  };

  const closeModal = () => setModal(null);

  const modalInitial = useMemo(() => {
    if (!modal) return null;
    if (modal.mode === "edit") return members.find(x => x.id === modal.memberId) || null;
    return {
      id: modal.memberId,
      name: "",
      email: "",
        roleLabel: "执行成员" as const,
      avatar: pickAvatar(modal.memberId),
      projectTypes: "",
      skills: ["视频"] as SkillTag[],
      note: "",
    } as MemberProfile;
  }, [members, modal]);

  const saveMember = (next: MemberProfile) => {
    setMembers(prev => {
      const idx = prev.findIndex(x => x.id === next.id);
      if (idx >= 0) {
        const copy = prev.slice();
        copy[idx] = next;
        return copy;
      }
      return [next, ...prev];
    });
    setSelectedId(next.id);
    setPanelMode("detail");
    closeModal();
    showToast(modal?.mode === "add" ? "已新增成员。" : "已保存成员信息。");
  };

  const empty = computed.filteredMembers.length === 0;

  return (
    <div className="flex-1 flex flex-col" style={{ padding: "24px 40px 34px", background: PAGE_BG }}>
      <TeamHeader onAdd={openAdd} />

      <TeamFilters
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        sortField={sortField}
        sortDirection={sortDirection}
        onToggleSort={toggleSort}
        search={search}
        setSearch={setSearch}
      />

      <div className="flex flex-1 min-h-0" style={{ gap: 18 }}>
        <div className="flex-1 min-w-0 overflow-y-auto" style={{ paddingBottom: 8 }}>
          {empty ? (
            <div style={{ borderRadius: 18, border: `1px solid ${BORDER_WEAK}`, background: "#fff", boxShadow: "0 18px 50px rgba(15, 23, 42, 0.06)", padding: "56px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: TEXT_MAIN }}>暂无匹配成员，请调整搜索或筛选条件。</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-[18px]">
              {computed.filteredMembers.map(m => (
                <MemberCard
                  key={m.id}
                  member={m}
                  stats={computed.statsById[m.id] || { currentTasks: 0, toSubmit: 0, waitingSignoff: 0, needFix: 0, passed: 0, monthDone: 0, revisionCount: 0 }}
                  selected={selectedId === m.id}
                  onSelect={() => pickMember(m.id)}
                />
              ))}
            </div>
          )}
        </div>

        <RightPanel
          mode={computed.selected ? panelMode : "empty"}
          selected={computed.selected}
          selectedStats={computed.selectedStats}
          selectedPerformance={computed.selectedPerformance}
          selectedTasks={computed.selectedTasks}
          onOpenEdit={openEdit}
          onViewTasks={() => setPanelMode("tasks")}
          onBackDetail={() => setPanelMode("detail")}
        />
      </div>

      {toast && (
        <div style={{ position: "fixed", left: 24 + 260, bottom: 18, zIndex: 60 }}>
          <div style={{ borderRadius: 999, background: "rgba(15, 23, 42, 0.92)", color: "#fff", padding: "10px 14px", fontSize: 12, fontWeight: 900, boxShadow: "0 18px 50px rgba(15, 23, 42, 0.24)" }}>
            {toast}
          </div>
        </div>
      )}

      {modal && modalInitial && (
        <MemberModal
          mode={modal.mode}
          initial={modalInitial}
          onClose={closeModal}
          onSave={saveMember}
        />
      )}
    </div>
  );
}
