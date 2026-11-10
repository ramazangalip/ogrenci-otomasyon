type VisionDevStudioCreditProps = {
  className?: string;
};

export function VisionDevStudioCredit({
  className = "",
}: VisionDevStudioCreditProps) {
  return (
    <p className={`text-xs text-slate-500/70 ${className}`}>
      Bu sistem{" "}
      <a
        href="https://visiondevstudio.com.tr/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-slate-400/80 underline decoration-slate-600/70 underline-offset-4 transition-colors hover:text-slate-200"
      >
        VisionDevStudio
      </a>{" "}
      tarafından yapılmıştır.
    </p>
  );
}
