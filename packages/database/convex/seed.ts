import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const seedDatabase = mutation({
  args: {
    adminClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if already seeded
    const existingQuestions = await ctx.db.query("questions").first();
    if (existingQuestions) {
      return { message: "Database already seeded" };
    }

    // Create or get admin user
    let adminUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.adminClerkId))
      .first();

    if (!adminUser) {
      const adminId = await ctx.db.insert("users", {
        clerkId: args.adminClerkId,
        email: "admin@mocktest.com",
        name: "Admin User",
        role: "admin",
        createdAt: Date.now(),
      });
      adminUser = await ctx.db.get(adminId);
    }

    if (!adminUser) {
      throw new Error("Failed to create admin user");
    }

    // ==================== BATCHES ====================
    const batch2024 = await ctx.db.insert("batches", {
      name: "JEE 2024",
      description: "JEE Main & Advanced preparation batch for 2024",
      isActive: true,
      createdBy: adminUser._id,
      createdAt: Date.now(),
    });

    const batch2025 = await ctx.db.insert("batches", {
      name: "JEE 2025",
      description: "JEE Main & Advanced preparation batch for 2025",
      isActive: true,
      createdBy: adminUser._id,
      createdAt: Date.now(),
    });

    const batchNEET = await ctx.db.insert("batches", {
      name: "NEET 2024",
      description: "NEET preparation batch for 2024",
      isActive: true,
      createdBy: adminUser._id,
      createdAt: Date.now(),
    });

    // ==================== QUESTIONS ====================

    // Mathematics Questions
    const mathQuestions = [
      {
        text: "What is the derivative of x² + 3x + 5?",
        options: ["2x + 3", "x² + 3", "2x + 5", "x + 3"],
        correctOptions: [0],
        explanation: "The derivative of x² is 2x, derivative of 3x is 3, and derivative of constant 5 is 0. So the answer is 2x + 3.",
        subject: "Mathematics",
        topic: "Calculus",
        difficulty: "easy" as const,
      },
      {
        text: "If sin(θ) = 3/5, what is cos(θ) in the first quadrant?",
        options: ["4/5", "3/4", "5/4", "5/3"],
        correctOptions: [0],
        explanation: "Using sin²θ + cos²θ = 1, we get cos²θ = 1 - 9/25 = 16/25, so cosθ = 4/5 in the first quadrant.",
        subject: "Mathematics",
        topic: "Trigonometry",
        difficulty: "medium" as const,
      },
      {
        text: "Solve: 2x + 5 = 15",
        options: ["x = 5", "x = 10", "x = 7.5", "x = 4"],
        correctOptions: [0],
        explanation: "2x + 5 = 15 → 2x = 10 → x = 5",
        subject: "Mathematics",
        topic: "Algebra",
        difficulty: "easy" as const,
      },
      {
        text: "What is the integral of 2x dx?",
        options: ["x² + C", "2x² + C", "x + C", "2 + C"],
        correctOptions: [0],
        explanation: "The integral of 2x is x² + C (constant of integration).",
        subject: "Mathematics",
        topic: "Calculus",
        difficulty: "easy" as const,
      },
      {
        text: "In a right triangle, if the two legs are 3 and 4, what is the hypotenuse?",
        options: ["5", "6", "7", "12"],
        correctOptions: [0],
        explanation: "Using Pythagorean theorem: √(3² + 4²) = √(9 + 16) = √25 = 5",
        subject: "Mathematics",
        topic: "Geometry",
        difficulty: "easy" as const,
      },
    ];

    // Physics Questions
    const physicsQuestions = [
      {
        text: "What is the SI unit of force?",
        options: ["Newton", "Joule", "Watt", "Pascal"],
        correctOptions: [0],
        explanation: "The SI unit of force is Newton (N), named after Sir Isaac Newton.",
        subject: "Physics",
        topic: "Mechanics",
        difficulty: "easy" as const,
      },
      {
        text: "A car accelerates from 0 to 20 m/s in 4 seconds. What is its acceleration?",
        options: ["5 m/s²", "4 m/s²", "20 m/s²", "80 m/s²"],
        correctOptions: [0],
        explanation: "Acceleration = (final velocity - initial velocity) / time = (20 - 0) / 4 = 5 m/s²",
        subject: "Physics",
        topic: "Mechanics",
        difficulty: "easy" as const,
      },
      {
        text: "Which of the following is a vector quantity?",
        options: ["Velocity", "Speed", "Mass", "Temperature"],
        correctOptions: [0],
        explanation: "Velocity is a vector quantity as it has both magnitude and direction. Speed, mass, and temperature are scalar quantities.",
        subject: "Physics",
        topic: "Mechanics",
        difficulty: "easy" as const,
      },
      {
        text: "What is the formula for kinetic energy?",
        options: ["½mv²", "mgh", "mv", "ma"],
        correctOptions: [0],
        explanation: "Kinetic energy = ½ × mass × velocity² = ½mv²",
        subject: "Physics",
        topic: "Mechanics",
        difficulty: "easy" as const,
      },
      {
        text: "Light travels fastest in which medium?",
        options: ["Vacuum", "Air", "Water", "Glass"],
        correctOptions: [0],
        explanation: "Light travels fastest in vacuum at approximately 3 × 10⁸ m/s. It slows down in denser media.",
        subject: "Physics",
        topic: "Optics",
        difficulty: "easy" as const,
      },
    ];

    // Chemistry Questions
    const chemistryQuestions = [
      {
        text: "What is the chemical symbol for Gold?",
        options: ["Au", "Ag", "Fe", "Cu"],
        correctOptions: [0],
        explanation: "Au comes from the Latin word 'Aurum' meaning gold.",
        subject: "Chemistry",
        topic: "Inorganic Chemistry",
        difficulty: "easy" as const,
      },
      {
        text: "What is the pH of a neutral solution?",
        options: ["7", "0", "14", "1"],
        correctOptions: [0],
        explanation: "A neutral solution has a pH of 7. Below 7 is acidic, above 7 is basic.",
        subject: "Chemistry",
        topic: "Physical Chemistry",
        difficulty: "easy" as const,
      },
      {
        text: "Which gas is released when an acid reacts with a metal?",
        options: ["Hydrogen", "Oxygen", "Nitrogen", "Carbon dioxide"],
        correctOptions: [0],
        explanation: "When acids react with metals, hydrogen gas is released. Example: Zn + 2HCl → ZnCl₂ + H₂",
        subject: "Chemistry",
        topic: "Inorganic Chemistry",
        difficulty: "easy" as const,
      },
      {
        text: "What is the molecular formula of water?",
        options: ["H₂O", "H₂O₂", "HO", "H₃O"],
        correctOptions: [0],
        explanation: "Water consists of 2 hydrogen atoms and 1 oxygen atom, giving H₂O.",
        subject: "Chemistry",
        topic: "Inorganic Chemistry",
        difficulty: "easy" as const,
      },
      {
        text: "Which of the following is an organic compound?",
        options: ["Methane (CH₄)", "Sodium chloride (NaCl)", "Water (H₂O)", "Sulfuric acid (H₂SO₄)"],
        correctOptions: [0],
        explanation: "Methane (CH₄) is an organic compound as it contains carbon-hydrogen bonds.",
        subject: "Chemistry",
        topic: "Organic Chemistry",
        difficulty: "easy" as const,
      },
    ];

    // Computer Science Questions
    const csQuestions = [
      {
        text: "What does CPU stand for?",
        options: ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Computer Processing Unit"],
        correctOptions: [0],
        explanation: "CPU stands for Central Processing Unit, the primary component that executes instructions.",
        subject: "Computer Science",
        topic: "Programming",
        difficulty: "easy" as const,
      },
      {
        text: "Which data structure uses LIFO (Last In First Out)?",
        options: ["Stack", "Queue", "Array", "Linked List"],
        correctOptions: [0],
        explanation: "Stack follows LIFO - the last element added is the first one to be removed.",
        subject: "Computer Science",
        topic: "Data Structures",
        difficulty: "easy" as const,
      },
      {
        text: "What is the time complexity of binary search?",
        options: ["O(log n)", "O(n)", "O(n²)", "O(1)"],
        correctOptions: [0],
        explanation: "Binary search divides the search space in half each time, giving O(log n) complexity.",
        subject: "Computer Science",
        topic: "Algorithms",
        difficulty: "medium" as const,
      },
      {
        text: "Which of the following is NOT a programming paradigm?",
        options: ["Sequential", "Object-Oriented", "Functional", "Procedural"],
        correctOptions: [0],
        explanation: "Sequential is not a programming paradigm. The main paradigms are procedural, object-oriented, functional, and logical.",
        subject: "Computer Science",
        topic: "Programming",
        difficulty: "medium" as const,
      },
      {
        text: "What is the output of: print(2 ** 3) in Python?",
        options: ["8", "6", "9", "5"],
        correctOptions: [0],
        explanation: "In Python, ** is the exponentiation operator. 2 ** 3 = 2³ = 8",
        subject: "Computer Science",
        topic: "Programming",
        difficulty: "easy" as const,
      },
    ];

    // Insert all questions
    const allQuestions = [...mathQuestions, ...physicsQuestions, ...chemistryQuestions, ...csQuestions];
    const questionIds: string[] = [];

    for (const q of allQuestions) {
      const id = await ctx.db.insert("questions", {
        ...q,
        createdBy: adminUser._id,
        createdAt: Date.now(),
      });
      questionIds.push(id);
    }

    // ==================== TESTS ====================

    // Test 1: Mathematics Quiz
    const mathTest = await ctx.db.insert("tests", {
      title: "Mathematics Fundamentals",
      description: "Test your basic mathematics skills including algebra, calculus, and geometry.",
      questions: questionIds.slice(0, 5) as any, // Math questions
      duration: 15,
      totalMarks: 50,
      negativeMarking: 0.5,
      status: "published",
      batchIds: [batch2024, batch2025],
      createdBy: adminUser._id,
      createdAt: Date.now(),
    });

    // Test 2: Physics Quiz
    const physicsTest = await ctx.db.insert("tests", {
      title: "Physics Basics",
      description: "Test your understanding of fundamental physics concepts.",
      questions: questionIds.slice(5, 10) as any, // Physics questions
      duration: 15,
      totalMarks: 50,
      negativeMarking: 0.5,
      status: "published",
      batchIds: [batch2024, batch2025],
      createdBy: adminUser._id,
      createdAt: Date.now(),
    });

    // Test 3: Science Combined
    const scienceTest = await ctx.db.insert("tests", {
      title: "Science Combined Test",
      description: "A comprehensive test covering Physics and Chemistry.",
      questions: questionIds.slice(5, 15) as any, // Physics + Chemistry
      duration: 30,
      totalMarks: 100,
      negativeMarking: 0.25,
      status: "published",
      batchIds: [batch2024],
      createdBy: adminUser._id,
      createdAt: Date.now(),
    });

    // Test 4: Computer Science
    const csTest = await ctx.db.insert("tests", {
      title: "Computer Science Basics",
      description: "Test your knowledge of programming and data structures.",
      questions: questionIds.slice(15, 20) as any, // CS questions
      duration: 20,
      totalMarks: 50,
      negativeMarking: 0,
      status: "published",
      createdBy: adminUser._id,
      createdAt: Date.now(),
    });

    // Test 5: Full Mock Test (Draft)
    const fullTest = await ctx.db.insert("tests", {
      title: "Full Mock Test - All Subjects",
      description: "A comprehensive mock test covering all subjects. Coming soon!",
      questions: questionIds as any,
      duration: 60,
      totalMarks: 200,
      negativeMarking: 0.25,
      status: "draft",
      batchIds: [batch2024, batch2025, batchNEET],
      createdBy: adminUser._id,
      createdAt: Date.now(),
    });

    // ==================== NOTES ====================

    const notes = [
      {
        title: "Calculus Cheat Sheet",
        description: "Quick reference for derivatives and integrals of common functions.",
        subject: "Mathematics",
        topic: "Calculus",
        fileUrl: "https://tutorial.math.lamar.edu/pdf/calculus_cheat_sheet_all.pdf",
        batchIds: [batch2024, batch2025],
      },
      {
        title: "Physics Formulas",
        description: "Important physics formulas for mechanics, thermodynamics, and waves.",
        subject: "Physics",
        topic: "Mechanics",
        fileUrl: "https://www.eeweb.com/tools/physics-formula-sheet",
        batchIds: [batch2024, batch2025],
      },
      {
        title: "Periodic Table",
        description: "Complete periodic table with atomic numbers and masses.",
        subject: "Chemistry",
        topic: "Inorganic Chemistry",
        fileUrl: "https://pubchem.ncbi.nlm.nih.gov/periodic-table/",
      },
      {
        title: "Data Structures Overview",
        description: "Comprehensive guide to arrays, linked lists, trees, and graphs.",
        subject: "Computer Science",
        topic: "Data Structures",
        fileUrl: "https://www.geeksforgeeks.org/data-structures/",
      },
      {
        title: "Trigonometry Identities",
        description: "All important trigonometric identities and formulas.",
        subject: "Mathematics",
        topic: "Trigonometry",
        fileUrl: "https://www.mathsisfun.com/algebra/trigonometric-identities.html",
        batchIds: [batch2024],
      },
    ];

    for (const note of notes) {
      await ctx.db.insert("notes", {
        ...note,
        batchIds: note.batchIds as Id<"batches">[] | undefined,
        createdBy: adminUser._id,
        createdAt: Date.now(),
      });
    }

    // ==================== CLASSES ====================

    const classes = [
      {
        title: "Introduction to Calculus",
        description: "Learn the basics of derivatives and integrals in this comprehensive introduction.",
        subject: "Mathematics",
        topic: "Calculus",
        videoUrl: "https://www.youtube.com/watch?v=WUvTyaaNkzM",
        duration: 3600, // 1 hour
        thumbnail: "https://i.ytimg.com/vi/WUvTyaaNkzM/maxresdefault.jpg",
        batchIds: [batch2024, batch2025],
      },
      {
        title: "Newton's Laws of Motion",
        description: "Understanding the three fundamental laws of motion with examples.",
        subject: "Physics",
        topic: "Mechanics",
        videoUrl: "https://www.youtube.com/watch?v=kKKM8Y-u7ds",
        duration: 2400, // 40 minutes
        thumbnail: "https://i.ytimg.com/vi/kKKM8Y-u7ds/maxresdefault.jpg",
        batchIds: [batch2024, batch2025],
      },
      {
        title: "Organic Chemistry Basics",
        description: "Introduction to organic compounds, functional groups, and reactions.",
        subject: "Chemistry",
        topic: "Organic Chemistry",
        videoUrl: "https://www.youtube.com/watch?v=bka20Q9TN6M",
        duration: 2700, // 45 minutes
        thumbnail: "https://i.ytimg.com/vi/bka20Q9TN6M/maxresdefault.jpg",
        batchIds: [batch2024],
      },
      {
        title: "Python Programming for Beginners",
        description: "Start your programming journey with Python basics and fundamentals.",
        subject: "Computer Science",
        topic: "Programming",
        videoUrl: "https://www.youtube.com/watch?v=kqtD5dpn9C8",
        duration: 4800, // 80 minutes
        thumbnail: "https://i.ytimg.com/vi/kqtD5dpn9C8/maxresdefault.jpg",
      },
      {
        title: "Algebra Fundamentals",
        description: "Master algebraic expressions, equations, and problem-solving techniques.",
        subject: "Mathematics",
        topic: "Algebra",
        videoUrl: "https://www.youtube.com/watch?v=NybHckSEQBI",
        duration: 3000, // 50 minutes
        thumbnail: "https://i.ytimg.com/vi/NybHckSEQBI/maxresdefault.jpg",
        batchIds: [batch2024, batch2025],
      },
    ];

    for (const classItem of classes) {
      await ctx.db.insert("classes", {
        ...classItem,
        batchIds: classItem.batchIds as Id<"batches">[] | undefined,
        createdBy: adminUser._id,
        createdAt: Date.now(),
      });
    }

    return {
      message: "Database seeded successfully!",
      data: {
        questions: questionIds.length,
        tests: 5,
        notes: notes.length,
        classes: classes.length,
        batches: 3,
      },
      batches: {
        batch2024,
        batch2025,
        batchNEET,
      },
    };
  },
});

// Seed mock attempts for testing leaderboard and heatmap
export const seedMockAttempts = mutation({
  args: {
    userId: v.id("users"),
    count: v.optional(v.number()), // Number of attempts to create (default 10)
  },
  handler: async (ctx, { userId, count = 10 }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Get all published tests
    const tests = await ctx.db
      .query("tests")
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    if (tests.length === 0) {
      throw new Error("No published tests found. Run seedDatabase first.");
    }

    const createdAttempts = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      // Pick a random test
      const test = tests[Math.floor(Math.random() * tests.length)];
      const questions = test.questions;

      // Generate random answers
      const answers = await Promise.all(
        questions.map(async (qId) => {
          const question = await ctx.db.get(qId);
          const shouldAnswer = Math.random() > 0.1; // 90% chance to answer
          if (!shouldAnswer) {
            return { questionId: qId, selected: [] };
          }

          const isCorrect = Math.random() > 0.35; // 65% chance of correct
          const selectedOption = isCorrect
            ? question?.correctOptions[0] ?? 0
            : Math.floor(Math.random() * 4);

          return { questionId: qId, selected: [selectedOption] };
        })
      );

      // Calculate score
      let correct = 0;
      let incorrect = 0;
      let unanswered = 0;

      for (let j = 0; j < answers.length; j++) {
        const question = await ctx.db.get(questions[j]);
        if (!question) continue;

        if (answers[j].selected.length === 0) {
          unanswered++;
        } else {
          const isCorrect = question.correctOptions.includes(answers[j].selected[0]);
          if (isCorrect) {
            correct++;
          } else {
            incorrect++;
          }
        }
      }

      const marksPerQuestion = test.totalMarks / test.questions.length;
      const score = Math.max(0, correct * marksPerQuestion - incorrect * test.negativeMarking);

      // Random date in the last 60 days
      const daysAgo = Math.floor(Math.random() * 60);
      const hoursAgo = Math.floor(Math.random() * 24);
      const submittedAt = now - daysAgo * 24 * 60 * 60 * 1000 - hoursAgo * 60 * 60 * 1000;

      const attemptId = await ctx.db.insert("attempts", {
        testId: test._id,
        userId,
        answers,
        score,
        totalQuestions: questions.length,
        correct,
        incorrect,
        unanswered,
        startedAt: submittedAt - test.duration * 1000 * Math.random(),
        submittedAt,
        status: "submitted",
      });

      createdAttempts.push({
        attemptId,
        testTitle: test.title,
        score: Math.round(score * 10) / 10,
        correct,
        incorrect,
        unanswered,
      });
    }

    return {
      message: `Created ${count} mock attempts for user ${user.name}`,
      attempts: createdAttempts,
    };
  },
});

// Create mock students with attempts for leaderboard testing
export const seedMockStudents = mutation({
  args: {
    batchId: v.id("batches"),
    count: v.optional(v.number()), // Number of students to create (default 5)
  },
  handler: async (ctx, { batchId, count = 5 }) => {
    const batch = await ctx.db.get(batchId);
    if (!batch) throw new Error("Batch not found");

    const mockNames = [
      "Rahul Sharma", "Priya Patel", "Arjun Singh", "Sneha Gupta", "Vikram Reddy",
      "Ananya Iyer", "Rohan Das", "Kavya Nair", "Aditya Kumar", "Meera Joshi",
      "Karan Mehta", "Divya Rao", "Amit Verma", "Pooja Chatterjee", "Nikhil Bansal",
    ];

    const createdStudents = [];

    for (let i = 0; i < Math.min(count, mockNames.length); i++) {
      const name = mockNames[i];
      const clerkId = `mock_${Date.now()}_${i}`;
      const email = `${name.toLowerCase().replace(" ", ".")}@example.com`;

      const userId = await ctx.db.insert("users", {
        clerkId,
        email,
        name,
        role: "student",
        batchId,
        createdAt: Date.now(),
      });

      // Create default settings
      await ctx.db.insert("userSettings", {
        userId,
        preferredChartType: Math.random() > 0.5 ? "heatmap" : "chart",
        showHeatmap: true,
        showStats: true,
        showOnLeaderboard: true,
        updatedAt: Date.now(),
      });

      createdStudents.push({ userId, name, email });
    }

    // Get published tests
    const tests = await ctx.db
      .query("tests")
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    // Create attempts for each student
    const now = Date.now();
    for (const student of createdStudents) {
      // Each student takes 5-15 random tests
      const attemptCount = 5 + Math.floor(Math.random() * 11);

      for (let i = 0; i < attemptCount; i++) {
        const test = tests[Math.floor(Math.random() * tests.length)];
        const questions = test.questions;

        const answers = await Promise.all(
          questions.map(async (qId) => {
            const question = await ctx.db.get(qId);
            const shouldAnswer = Math.random() > 0.1;
            if (!shouldAnswer) return { questionId: qId, selected: [] };

            const isCorrect = Math.random() > 0.4; // 60% correct
            const selectedOption = isCorrect
              ? question?.correctOptions[0] ?? 0
              : Math.floor(Math.random() * 4);

            return { questionId: qId, selected: [selectedOption] };
          })
        );

        let correct = 0, incorrect = 0, unanswered = 0;
        for (let j = 0; j < answers.length; j++) {
          const question = await ctx.db.get(questions[j]);
          if (!question) continue;
          if (answers[j].selected.length === 0) unanswered++;
          else if (question.correctOptions.includes(answers[j].selected[0])) correct++;
          else incorrect++;
        }

        const marksPerQuestion = test.totalMarks / test.questions.length;
        const score = Math.max(0, correct * marksPerQuestion - incorrect * test.negativeMarking);
        const daysAgo = Math.floor(Math.random() * 30);
        const submittedAt = now - daysAgo * 24 * 60 * 60 * 1000;

        await ctx.db.insert("attempts", {
          testId: test._id,
          userId: student.userId,
          answers,
          score,
          totalQuestions: questions.length,
          correct,
          incorrect,
          unanswered,
          startedAt: submittedAt - test.duration * 1000 * 0.8,
          submittedAt,
          status: "submitted",
        });
      }
    }

    return {
      message: `Created ${count} mock students with attempts in batch "${batch.name}"`,
      students: createdStudents,
    };
  },
});
