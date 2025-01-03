import { MultiStepLoader } from "@/components/ui/multi-step-loader";

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <MultiStepLoader
        loadingStates={[
          {
            text: 'Connecting to LinkedIn...',
          },
          {
            text: 'Fetching your profile data...',
          },
          {
            text: 'Re-analyzing work experience...',
          },
          {
            text: 'Updating skills and expertise...',
          },
          {
            text: 'Syncing education history...',
          },
          {
            text: 'Finalizing your updated profile...',
          },
        ]}
        loading={true}
        duration={5000}
        loop={false}
      />
    </div>
  );
}