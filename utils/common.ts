export const getLast7Days = () => {
  const daysoOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const result = [];

  for (let i = 0; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    result.push({
      day: daysoOfWeek[date.getDay()],
      date: date.toISOString().split("T")[0],
      gases: 0,
    });
  }
  return result.reverse();
};
