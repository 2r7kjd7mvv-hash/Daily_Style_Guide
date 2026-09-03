interface TripStepActionInput {
  hasDestination: boolean;
  startDate: string;
  endDate: string;
  style: string;
}

export function getTripStepAction(input: TripStepActionInput) {
  return {
    label: '下一步：AI 生成',
    disabled: !(
      input.hasDestination &&
      input.startDate &&
      input.endDate &&
      input.style
    ),
  };
}
