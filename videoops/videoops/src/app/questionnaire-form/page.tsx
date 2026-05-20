"use client";

import { useRouter } from "next/navigation";
import QuestionnaireForm from "@/components/pages/QuestionnaireForm";

export default function QuestionnaireFormPage() {
  const router = useRouter();

  return <QuestionnaireForm onBack={() => router.back()} />;
}
