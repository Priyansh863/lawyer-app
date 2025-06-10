import moment from 'moment';

export const getGreeting = () => {
  const hour = moment().hour();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};
