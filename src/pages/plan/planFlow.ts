interface TripStepActionInput {
  hasDestination: boolean;
  startDate: string;
  endDate: string;
  style: string;
}

const DAY_MS = 86400000;

function parseLocalDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function formatLocalDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getForecastMaxDate(now = new Date()) {
  const maxDate = startOfDay(now);
  maxDate.setDate(maxDate.getDate() + 7);
  return formatLocalDate(maxDate);
}

export function validateTravelDates(startDate: string, endDate: string, now = new Date()) {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  if (!start || !end) return '请完善日期';

  const today = startOfDay(now);
  const forecastMax = new Date(today);
  forecastMax.setDate(forecastMax.getDate() + 7);

  if (start < today) return '开始日期不能早于今天';
  if (start > forecastMax) return '开始日期请选择未来 7 天内';
  if (end < start) return '结束日期不能早于开始日期';
  if (end > forecastMax) return '结束日期请选择未来 7 天内';

  const duration = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
  if (duration > 7) return '旅行周期最多选择 7 天';
  return null;
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
