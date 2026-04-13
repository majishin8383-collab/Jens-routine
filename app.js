(() => {
  // ---------------- Plan ----------------
  const PLAN = {
    A: {
      title: "Workout A — Lower Body and Glutes",
      exercises: [
        "Goblet Squat",
        "Hip Thrust",
        "Romanian Deadlift",
        "Leg Curl"
      ]
    },
    B: {
      title: "Workout B — Upper Body",
      exercises: [
        "Lat Pulldown",
        "Dumbbell Shoulder Press",
        "Seated Row",
        "Triceps Pressdown",
        "Biceps Curl"
      ]
    },
    C: {
      title: "Workout C — Full Body and Conditioning",
      exercises: [
        "Walking Lunges",
        "Kettlebell Swing",
        "Plank",
        "Incline Walk"
      ]
    }
  };

  // ---------------- Rules ----------------
  const RULES = {
    "Goblet Squat": { repMin: 10, repMax: 15, inc: 5, units: "lb" },
    "Hip Thrust": { repMin: 12, repMax: 15, inc: 10, units: "lb" },
    "Romanian Deadlift": { repMin: 10, repMax: 12, inc: 5, units: "lb" },
    "Leg Curl": { repMin: 12, repMax: 15, inc: 5, units: "lb" },

    "Lat Pulldown": { repMin: 10, repMax: 12, inc: 5, units: "lb" },
    "Dumbbell Shoulder Press": { repMin: 10, repMax: 12, inc: 5, units: "lb" },
    "Seated Row": { repMin: 10, repMax: 12, inc: 5, units: "lb" },
    "Triceps Pressdown": { repMin: 12, repMax: 15, inc: 5, units: "lb" },
    "Biceps Curl": { repMin: 10, repMax: 15, inc: 5, units: "lb" },

    "Walking Lunges": { repMin: 10, repMax: 14, inc: 5, units: "lb" },
    "Kettlebell Swing": { repMin: 12, repMax: 20, inc: 5, units: "lb" },
    "Plank": { repMin: 1, repMax: 1
