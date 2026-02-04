import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { requireAdmin, requireAuth, getOrgId } from "./lib/auth";

// Clear ALL data from the database (including admin and organization)
export const clearAllData = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const tables = [
      "users",
      "questions",
      "tests",
      "attempts",
      "batches",
      "classes",
      "notes",
      "userSettings",
      "organizations",
      "fees",
      "feeQueries",
      "feeQueryMessages",
      "notifications",
      "chatConversations",
      "chatMessages",
      "orgAdmins",
      "orgJoinRequests",
      "subjects",
    ] as const;

    const deleted: Record<string, number> = {};

    for (const table of tables) {
      const records = await ctx.db.query(table).collect();
      for (const record of records) {
        await ctx.db.delete(record._id);
      }
      deleted[table] = records.length;
    }

    return {
      message: "All data cleared successfully! You will need to re-onboard.",
      deleted,
    };
  },
});

// Clear only seed data (keeps admin user and organization)
export const clearSeedData = mutation({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    const orgId = admin.organizationId;

    if (!orgId) {
      return { message: "No organization found", deleted: {} };
    }

    const deleted: Record<string, number> = {};

    // Delete attempts first (references tests and users)
    const attempts = await ctx.db.query("attempts").collect();
    for (const record of attempts) {
      await ctx.db.delete(record._id);
    }
    deleted.attempts = attempts.length;

    // Delete fee query messages first (references feeQueries)
    const feeQueries = await ctx.db
      .query("feeQueries")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .collect();
    let feeQueryMessagesCount = 0;
    for (const query of feeQueries) {
      const messages = await ctx.db
        .query("feeQueryMessages")
        .withIndex("by_query", (q) => q.eq("queryId", query._id))
        .collect();
      for (const msg of messages) {
        await ctx.db.delete(msg._id);
      }
      feeQueryMessagesCount += messages.length;
    }
    deleted.feeQueryMessages = feeQueryMessagesCount;

    // Delete fee queries (references fees and users)
    for (const query of feeQueries) {
      await ctx.db.delete(query._id);
    }
    deleted.feeQueries = feeQueries.length;

    // Delete fees (references users)
    const fees = await ctx.db
      .query("fees")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .collect();
    for (const record of fees) {
      await ctx.db.delete(record._id);
    }
    deleted.fees = fees.length;

    // Delete userSettings for students
    const students = await ctx.db
      .query("users")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .collect()
      .then((users) => users.filter((u) => u.role === "student"));

    for (const student of students) {
      const settings = await ctx.db
        .query("userSettings")
        .withIndex("by_user_id", (q) => q.eq("userId", student._id))
        .collect();
      for (const setting of settings) {
        await ctx.db.delete(setting._id);
      }
    }
    deleted.userSettings = students.length;

    // Delete student users (keep admin)
    for (const student of students) {
      await ctx.db.delete(student._id);
    }
    deleted.students = students.length;

    // Delete tests
    const tests = await ctx.db
      .query("tests")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .collect();
    for (const record of tests) {
      await ctx.db.delete(record._id);
    }
    deleted.tests = tests.length;

    // Delete questions
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .collect();
    for (const record of questions) {
      await ctx.db.delete(record._id);
    }
    deleted.questions = questions.length;

    // Delete batches
    const batches = await ctx.db
      .query("batches")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .collect();
    for (const record of batches) {
      await ctx.db.delete(record._id);
    }
    deleted.batches = batches.length;

    // Delete classes
    const classes = await ctx.db
      .query("classes")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .collect();
    for (const record of classes) {
      await ctx.db.delete(record._id);
    }
    deleted.classes = classes.length;

    // Delete notes
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .collect();
    for (const record of notes) {
      await ctx.db.delete(record._id);
    }
    deleted.notes = notes.length;

    // Delete subjects
    const subjects = await ctx.db
      .query("subjects")
      .withIndex("by_org", (q) => q.eq("organizationId", orgId))
      .collect();
    for (const record of subjects) {
      await ctx.db.delete(record._id);
    }
    deleted.subjects = subjects.length;

    return {
      message: "Seed data cleared successfully! Admin and organization preserved.",
      deleted,
    };
  },
});

export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);

    const identity = await ctx.auth.getUserIdentity();
    const adminClerkId = identity!.subject;

    // ==================== ORGANIZATION ====================
    let orgId: Id<"organizations">;
    const existingOrg = await ctx.db
      .query("organizations")
      .withIndex("by_admin_clerk_id", (q) =>
        q.eq("adminClerkId", adminClerkId)
      )
      .first();

    if (!existingOrg) {
      orgId = await ctx.db.insert("organizations", {
        name: "Bengal Competitive Academy",
        slug: "bengal-competitive-academy",
        description:
          "West Bengal's leading coaching institute for competitive exams — WB Police, Railway NTPC, SSC, and Bengali language preparation.",
        contactEmail: "admin@bengalacademy.com",
        phone: "+91 98300 00000",
        address: "Salt Lake Sector V, Kolkata, West Bengal 700091",
        adminClerkId,
        createdAt: Date.now(),
      });
      // Patch admin with orgId
      await ctx.db.patch(admin._id, { organizationId: orgId });
    } else {
      orgId = existingOrg._id;
    }

    // ==================== SUBJECTS ====================
    const defaultSubjects = [
      "General Knowledge", "Mathematics", "Reasoning", "Bengali",
      "English", "General Science", "Indian History", "Geography",
    ];
    const existingSubjects = await ctx.db
      .query("subjects")
      .withIndex("by_org", (q) => q.eq("organizationId", orgId))
      .collect();
    const existingSubjectNames = new Set(existingSubjects.map((s) => s.name));
    for (const name of defaultSubjects) {
      if (!existingSubjectNames.has(name)) {
        await ctx.db.insert("subjects", { name, organizationId: orgId });
      }
    }

    // ==================== BATCHES ====================
    const batchWBPolice = await ctx.db.insert("batches", {
      name: "WB Police 2025",
      description:
        "West Bengal Police Constable & SI recruitment exam preparation batch",
      isActive: true,
      referralCode: "WBPOL25",
      organizationId: orgId,
      createdBy: admin._id,
      createdAt: Date.now(),
    });

    const batchNTPC = await ctx.db.insert("batches", {
      name: "Railway NTPC 2025",
      description:
        "Indian Railway NTPC (Non-Technical Popular Categories) exam preparation",
      isActive: true,
      referralCode: "NTPC25",
      organizationId: orgId,
      createdBy: admin._id,
      createdAt: Date.now(),
    });

    const batchSSC = await ctx.db.insert("batches", {
      name: "SSC 2025",
      description:
        "Staff Selection Commission CGL/CHSL/MTS exam preparation batch",
      isActive: true,
      referralCode: "SSC25A",
      organizationId: orgId,
      createdBy: admin._id,
      createdAt: Date.now(),
    });

    const batchBengali = await ctx.db.insert("batches", {
      name: "Bengali Language 2025",
      description:
        "Bengali language and literature preparation for WBCS, WB Police, and other state-level exams",
      isActive: true,
      referralCode: "BNGL25",
      organizationId: orgId,
      createdBy: admin._id,
      createdAt: Date.now(),
    });

    // ==================== QUESTIONS ====================
    const gkQuestions = [
      { text: "Who is the current Chief Minister of West Bengal?", options: ["Mamata Banerjee", "Buddhadeb Bhattacharjee", "Jyoti Basu", "Bidhan Chandra Roy"], correctOptions: [0], explanation: "Mamata Banerjee has been serving as the Chief Minister of West Bengal since 2011.", subject: "General Knowledge", difficulty: "easy" as const },
      { text: "Kolkata is situated on the banks of which river?", options: ["Hooghly", "Ganga", "Damodar", "Teesta"], correctOptions: [0], explanation: "Kolkata is situated on the eastern bank of the Hooghly River.", subject: "General Knowledge", difficulty: "easy" as const },
      { text: "Which article of the Indian Constitution deals with the Right to Equality?", options: ["Article 14", "Article 19", "Article 21", "Article 32"], correctOptions: [0], explanation: "Article 14 guarantees equality before the law.", subject: "General Knowledge", difficulty: "medium" as const },
      { text: "The Reserve Bank of India was established in which year?", options: ["1935", "1947", "1950", "1929"], correctOptions: [0], explanation: "The RBI was established on April 1, 1935.", subject: "General Knowledge", difficulty: "medium" as const },
      { text: "Which district of West Bengal is famous for Darjeeling tea?", options: ["Darjeeling", "Jalpaiguri", "Cooch Behar", "Alipurduar"], correctOptions: [0], explanation: "Darjeeling district is world-famous for its tea.", subject: "General Knowledge", difficulty: "easy" as const },
    ];

    const mathQuestions = [
      { text: "A shopkeeper sells an article for ₹450, making a profit of 25%. What is the cost price?", options: ["₹360", "₹400", "₹350", "₹375"], correctOptions: [0], explanation: "CP = SP / (1 + Profit%) = 450 / 1.25 = ₹360", subject: "Mathematics", difficulty: "easy" as const },
      { text: "If A can do a work in 12 days and B can do it in 18 days, how many days will they take working together?", options: ["7.2 days", "8 days", "6 days", "9 days"], correctOptions: [0], explanation: "Combined rate = 1/12 + 1/18 = 5/36. Time = 36/5 = 7.2 days.", subject: "Mathematics", difficulty: "medium" as const },
      { text: "What is 35% of 800?", options: ["280", "320", "260", "300"], correctOptions: [0], explanation: "35% of 800 = 280", subject: "Mathematics", difficulty: "easy" as const },
      { text: "A train 200m long passes a pole in 10 seconds. What is its speed in km/h?", options: ["72 km/h", "60 km/h", "80 km/h", "54 km/h"], correctOptions: [0], explanation: "Speed = 200/10 = 20 m/s = 72 km/h.", subject: "Mathematics", difficulty: "medium" as const },
      { text: "Find the HCF of 36 and 48.", options: ["12", "6", "24", "8"], correctOptions: [0], explanation: "HCF = 12.", subject: "Mathematics", difficulty: "easy" as const },
    ];

    const reasoningQuestions = [
      { text: "Complete the series: 2, 6, 12, 20, 30, ?", options: ["42", "40", "36", "44"], correctOptions: [0], explanation: "Differences: 4, 6, 8, 10, 12. Next = 42.", subject: "Reasoning", difficulty: "medium" as const },
      { text: "If CLOUD is coded as DMPVE, how is RAIN coded?", options: ["SBJO", "SBJM", "QZHO", "RBJN"], correctOptions: [0], explanation: "Each letter +1: RAIN = SBJO.", subject: "Reasoning", difficulty: "easy" as const },
      { text: "Doctor : Hospital :: Teacher : ?", options: ["School", "Student", "Book", "Chalk"], correctOptions: [0], explanation: "A doctor works at a hospital, a teacher works at a school.", subject: "Reasoning", difficulty: "easy" as const },
      { text: "Pointing to a girl, Ramesh said, 'She is the daughter of my father's only son.' How is the girl related to Ramesh?", options: ["Daughter", "Sister", "Niece", "Mother"], correctOptions: [0], explanation: "Father's only son = Ramesh. So the girl is his daughter.", subject: "Reasoning", difficulty: "medium" as const },
      { text: "All roses are flowers. Some flowers are red. Conclusion: Some roses are red.", options: ["Does not follow", "Follows", "Both follow", "Neither follows"], correctOptions: [0], explanation: "The conclusion does not necessarily follow.", subject: "Reasoning", difficulty: "hard" as const },
    ];

    const bengaliQuestions = [
      { text: "'পথের পাঁচালী' উপন্যাসটি কার লেখা?", options: ["বিভূতিভূষণ বন্দ্যোপাধ্যায়", "শরৎচন্দ্র চট্টোপাধ্যায়", "বঙ্কিমচন্দ্র চট্টোপাধ্যায়", "রবীন্দ্রনাথ ঠাকুর"], correctOptions: [0], explanation: "পথের পাঁচালী বিভূতিভূষণ বন্দ্যোপাধ্যায়ের রচনা।", subject: "Bengali", difficulty: "easy" as const },
      { text: "'গীতাঞ্জলি' কাব্যগ্রন্থের রচয়িতা কে?", options: ["রবীন্দ্রনাথ ঠাকুর", "কাজী নজরুল ইসলাম", "মাইকেল মধুসূদন দত্ত", "জীবনানন্দ দাশ"], correctOptions: [0], explanation: "গীতাঞ্জলি রবীন্দ্রনাথ ঠাকুরের কাব্যগ্রন্থ।", subject: "Bengali", difficulty: "easy" as const },
      { text: "'সন্ধি' শব্দের অর্থ কী?", options: ["মিলন", "বিচ্ছেদ", "সমাস", "প্রত্যয়"], correctOptions: [0], explanation: "সন্ধি শব্দের অর্থ মিলন।", subject: "Bengali", difficulty: "easy" as const },
      { text: "'অগ্নি' শব্দের সমার্থক শব্দ কোনটি?", options: ["আগুন", "জল", "বায়ু", "মাটি"], correctOptions: [0], explanation: "অগ্নি শব্দের সমার্থক শব্দ আগুন।", subject: "Bengali", difficulty: "easy" as const },
      { text: "'বাংলা ভাষায় প্রথম উপন্যাস কোনটি?", options: ["আলালের ঘরের দুলাল", "দুর্গেশনন্দিনী", "কপালকুণ্ডলা", "রাজসিংহ"], correctOptions: [0], explanation: "'আলালের ঘরের দুলাল' (১৮৫৮) বাংলা ভাষায় প্রথম উপন্যাস।", subject: "Bengali", difficulty: "medium" as const },
    ];

    const englishQuestions = [
      { text: "Choose the correct spelling:", options: ["Accommodation", "Accomodation", "Acomodation", "Accommadation"], correctOptions: [0], explanation: "Correct: 'Accommodation'.", subject: "English", difficulty: "easy" as const },
      { text: "Find the error: 'He go to school every day.'", options: ["'go' should be 'goes'", "'to' should be 'at'", "'every' should be 'each'", "No error"], correctOptions: [0], explanation: "Third-person singular: 'goes'.", subject: "English", difficulty: "easy" as const },
      { text: "The synonym of 'Abundant' is:", options: ["Plentiful", "Scarce", "Rare", "Meagre"], correctOptions: [0], explanation: "'Abundant' = 'Plentiful'.", subject: "English", difficulty: "easy" as const },
      { text: "Choose the correct voice: 'The letter was written by her.'", options: ["Passive Voice", "Active Voice", "Imperative", "Exclamatory"], correctOptions: [0], explanation: "Passive voice.", subject: "English", difficulty: "easy" as const },
      { text: "Fill in the blank: 'He has been working here ___ 2015.'", options: ["since", "for", "from", "by"], correctOptions: [0], explanation: "'Since' for specific point in time.", subject: "English", difficulty: "easy" as const },
    ];

    const scienceQuestions = [
      { text: "Which vitamin is produced when our body is exposed to sunlight?", options: ["Vitamin D", "Vitamin A", "Vitamin C", "Vitamin B12"], correctOptions: [0], explanation: "Vitamin D from UV sunlight.", subject: "General Science", difficulty: "easy" as const },
      { text: "What is the chemical formula of common salt?", options: ["NaCl", "KCl", "CaCl₂", "NaOH"], correctOptions: [0], explanation: "Sodium Chloride = NaCl.", subject: "General Science", difficulty: "easy" as const },
      { text: "The SI unit of electric current is:", options: ["Ampere", "Volt", "Ohm", "Watt"], correctOptions: [0], explanation: "Ampere (A).", subject: "General Science", difficulty: "easy" as const },
      { text: "Which gas do plants absorb during photosynthesis?", options: ["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"], correctOptions: [0], explanation: "Plants absorb CO₂.", subject: "General Science", difficulty: "easy" as const },
      { text: "Ozone layer depletion is primarily caused by:", options: ["CFCs", "CO₂", "SO₂", "NO₂"], correctOptions: [0], explanation: "CFCs deplete ozone.", subject: "General Science", difficulty: "medium" as const },
    ];

    const historyQuestions = [
      { text: "Who was the first Governor-General of independent India?", options: ["Lord Mountbatten", "C. Rajagopalachari", "Jawaharlal Nehru", "Dr. Rajendra Prasad"], correctOptions: [0], explanation: "Lord Mountbatten (1947-1948).", subject: "Indian History", difficulty: "medium" as const },
      { text: "The Battle of Plassey was fought in which year?", options: ["1757", "1764", "1857", "1947"], correctOptions: [0], explanation: "Battle of Plassey: 1757.", subject: "Indian History", difficulty: "easy" as const },
      { text: "Who founded the Indian National Congress?", options: ["A.O. Hume", "Mahatma Gandhi", "Bal Gangadhar Tilak", "Dadabhai Naoroji"], correctOptions: [0], explanation: "A.O. Hume founded INC in 1885.", subject: "Indian History", difficulty: "easy" as const },
      { text: "The Harappan civilization belongs to which age?", options: ["Bronze Age", "Iron Age", "Stone Age", "Copper Age"], correctOptions: [0], explanation: "Bronze Age (3300-1300 BCE).", subject: "Indian History", difficulty: "medium" as const },
      { text: "Who was the founder of the Mughal Empire in India?", options: ["Babur", "Akbar", "Humayun", "Shah Jahan"], correctOptions: [0], explanation: "Babur in 1526.", subject: "Indian History", difficulty: "easy" as const },
    ];

    const geographyQuestions = [
      { text: "Sundarbans, the largest mangrove forest in the world, is located in:", options: ["West Bengal & Bangladesh", "Kerala", "Odisha", "Tamil Nadu"], correctOptions: [0], explanation: "Sundarbans spans West Bengal and Bangladesh.", subject: "Geography", difficulty: "easy" as const },
      { text: "What is the total number of districts in West Bengal?", options: ["23", "19", "21", "25"], correctOptions: [0], explanation: "West Bengal has 23 districts.", subject: "Geography", difficulty: "medium" as const },
      { text: "Which is the longest river of India?", options: ["Ganga", "Godavari", "Brahmaputra", "Yamuna"], correctOptions: [0], explanation: "Ganga: ~2,525 km.", subject: "Geography", difficulty: "easy" as const },
      { text: "The highest peak in West Bengal is:", options: ["Sandakphu", "Phalut", "Tiger Hill", "Tonglu"], correctOptions: [0], explanation: "Sandakphu (3,636m).", subject: "Geography", difficulty: "medium" as const },
      { text: "Which line divides India and Pakistan?", options: ["Radcliffe Line", "Durand Line", "McMahon Line", "Line of Control"], correctOptions: [0], explanation: "Radcliffe Line (1947).", subject: "Geography", difficulty: "easy" as const },
    ];

    const allQuestions = [
      ...gkQuestions, ...mathQuestions, ...reasoningQuestions, ...bengaliQuestions,
      ...englishQuestions, ...scienceQuestions, ...historyQuestions, ...geographyQuestions,
    ];
    const questionIds: string[] = [];

    for (const q of allQuestions) {
      const id = await ctx.db.insert("questions", {
        ...q,
        organizationId: orgId,
        createdBy: admin._id,
        createdAt: Date.now(),
      });
      questionIds.push(id);
    }

    // ==================== TESTS ====================
    await ctx.db.insert("tests", {
      title: "WB Police Prelims Mock Test",
      description: "Mock test for West Bengal Police Constable preliminary exam.",
      questions: [...questionIds.slice(0, 5), ...questionIds.slice(5, 10), ...questionIds.slice(10, 15)] as any,
      duration: 30, totalMarks: 150, negativeMarking: 0.5, status: "published",
      batchIds: [batchWBPolice], organizationId: orgId, createdBy: admin._id, createdAt: Date.now(),
    });

    await ctx.db.insert("tests", {
      title: "Railway NTPC CBT-1 Mock",
      description: "Mock test for Railway NTPC first stage.",
      questions: [...questionIds.slice(0, 5), ...questionIds.slice(5, 10), ...questionIds.slice(10, 15), ...questionIds.slice(25, 30)] as any,
      duration: 45, totalMarks: 200, negativeMarking: 0.33, status: "published",
      batchIds: [batchNTPC], organizationId: orgId, createdBy: admin._id, createdAt: Date.now(),
    });

    await ctx.db.insert("tests", {
      title: "SSC CGL Tier-1 Mock",
      description: "Mock test for SSC CGL Tier-1 exam.",
      questions: [...questionIds.slice(0, 5), ...questionIds.slice(5, 10), ...questionIds.slice(10, 15), ...questionIds.slice(20, 25)] as any,
      duration: 60, totalMarks: 200, negativeMarking: 0.5, status: "published",
      batchIds: [batchSSC], organizationId: orgId, createdBy: admin._id, createdAt: Date.now(),
    });

    await ctx.db.insert("tests", {
      title: "Bengali Language & Literature",
      description: "Practice test for Bengali grammar and literature.",
      questions: questionIds.slice(15, 20) as any,
      duration: 20, totalMarks: 50, negativeMarking: 0.25, status: "published",
      batchIds: [batchBengali, batchWBPolice], organizationId: orgId, createdBy: admin._id, createdAt: Date.now(),
    });

    await ctx.db.insert("tests", {
      title: "History & Geography Combined",
      description: "Combined test covering Indian History and Geography.",
      questions: [...questionIds.slice(30, 35), ...questionIds.slice(35, 40)] as any,
      duration: 30, totalMarks: 100, negativeMarking: 0.25, status: "published",
      batchIds: [batchWBPolice, batchNTPC, batchSSC], organizationId: orgId, createdBy: admin._id, createdAt: Date.now(),
    });

    await ctx.db.insert("tests", {
      title: "Grand Mock Test — All Subjects",
      description: "A comprehensive mock test covering all subjects. Coming soon!",
      questions: questionIds as any,
      duration: 90, totalMarks: 400, negativeMarking: 0.25, status: "draft",
      batchIds: [batchWBPolice, batchNTPC, batchSSC, batchBengali], organizationId: orgId, createdBy: admin._id, createdAt: Date.now(),
    });

    // ==================== NOTES ====================
    const notes = [
      { title: "WB Police Syllabus & Strategy", description: "Complete syllabus breakdown.", subject: "General Knowledge", fileUrl: "https://wbpolice.gov.in", batchIds: [batchWBPolice] },
      { title: "Quantitative Aptitude Formulas", description: "All important formulas.", subject: "Mathematics", fileUrl: "https://www.indiabix.com/aptitude/questions-and-answers/", batchIds: [batchWBPolice, batchNTPC, batchSSC] },
      { title: "Railway NTPC Previous Year Papers", description: "Previous year question papers.", subject: "General Knowledge", fileUrl: "https://www.rrbcdg.gov.in", batchIds: [batchNTPC] },
      { title: "Bengali Grammar Notes", description: "Comprehensive Bengali grammar notes.", subject: "Bengali", fileUrl: "https://www.banglabook.org", batchIds: [batchBengali, batchWBPolice] },
      { title: "Indian History Timeline", description: "Chronological timeline.", subject: "Indian History", fileUrl: "https://ncert.nic.in", batchIds: [batchWBPolice, batchNTPC, batchSSC] },
      { title: "West Bengal Geography Quick Notes", description: "Rivers, districts, national parks.", subject: "Geography", fileUrl: "https://wb.gov.in", batchIds: [batchWBPolice] },
    ];

    for (const note of notes) {
      await ctx.db.insert("notes", {
        ...note,
        batchIds: note.batchIds as Id<"batches">[] | undefined,
        organizationId: orgId,
        createdBy: admin._id,
        createdAt: Date.now(),
      });
    }

    // ==================== CLASSES ====================
    const classes = [
      { title: "WB Police GK Masterclass", description: "Complete GK revision.", subject: "General Knowledge", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", batchIds: [batchWBPolice] },
      { title: "Quantitative Aptitude — Percentage & Profit Loss", description: "Master percentage calculations.", subject: "Mathematics", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", batchIds: [batchWBPolice, batchNTPC, batchSSC] },
      { title: "Reasoning — Series & Coding-Decoding", description: "Solve series and coding problems.", subject: "Reasoning", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", batchIds: [batchNTPC, batchSSC] },
      { title: "Bengali সাহিত্য — রবীন্দ্রনাথ থেকে জীবনানন্দ", description: "বাংলা সাহিত্যের ইতিহাস।", subject: "Bengali", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", batchIds: [batchBengali, batchWBPolice] },
      { title: "Indian History — Freedom Movement", description: "Revolt of 1857 to Independence.", subject: "Indian History", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", batchIds: [batchWBPolice, batchNTPC, batchSSC] },
      { title: "General Science for Railway NTPC", description: "Physics, Chemistry, Biology basics.", subject: "General Science", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", batchIds: [batchNTPC] },
    ];

    for (const classItem of classes) {
      await ctx.db.insert("classes", {
        ...classItem,
        batchIds: classItem.batchIds as Id<"batches">[] | undefined,
        organizationId: orgId,
        createdBy: admin._id,
        createdAt: Date.now(),
      });
    }

    return {
      message: "Database seeded successfully!",
      data: { questions: questionIds.length, tests: 6, notes: notes.length, classes: classes.length, batches: 4 },
      batches: { batchWBPolice, batchNTPC, batchSSC, batchBengali },
    };
  },
});

export const seedMockStudents = mutation({
  args: {
    batchId: v.id("batches"),
    count: v.optional(v.number()),
  },
  handler: async (ctx, { batchId, count = 5 }) => {
    const admin = await requireAdmin(ctx);
    const adminOrgId = getOrgId(admin);

    const batch = await ctx.db.get(batchId);
    if (!batch) throw new Error("Batch not found");
    if (batch.organizationId !== adminOrgId) throw new Error("Access denied");

    const mockNames = [
      "Sourav Ghosh", "Arpita Das", "Debojit Mondal", "Shreya Banerjee", "Aniket Roy",
      "Moumita Sen", "Subhajit Saha", "Poulami Chatterjee", "Rishav Mukherjee", "Tanushree Sarkar",
      "Dipayan Dutta", "Ankita Bose", "Rajdeep Biswas", "Priyanka Pal", "Soumalya Nandi",
    ];

    const createdStudents = [];
    const now = Date.now();

    for (let i = 0; i < Math.min(count, mockNames.length); i++) {
      const name = mockNames[i];
      const clerkId = `mock_${Date.now()}_${i}`;
      const email = `${name.toLowerCase().replace(" ", ".")}@example.com`;

      const userId = await ctx.db.insert("users", {
        clerkId, email, name, role: "student", batchId, organizationId: adminOrgId, createdAt: now,
      });

      await ctx.db.insert("userSettings", {
        userId,
        preferredChartType: Math.random() > 0.5 ? "heatmap" : "chart",
        showHeatmap: true, showStats: true, showOnLeaderboard: true, updatedAt: now,
      });

      // ==================== FEES ====================
      const feeAmounts = [500, 800, 1000, 1200, 1500, 2000];
      const feeDescriptions = ["Monthly Tuition Fee", "Study Material Fee", "Exam Fee", "Registration Fee"];

      // 1-2 paid fees
      const paidCount = 1 + Math.floor(Math.random() * 2);
      for (let f = 0; f < paidCount; f++) {
        const amount = feeAmounts[Math.floor(Math.random() * feeAmounts.length)];
        const daysAgo = 30 + Math.floor(Math.random() * 60); // 30-90 days ago
        const dueDate = now - daysAgo * 24 * 60 * 60 * 1000;
        const paidDate = dueDate + Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000; // paid within a week of due

        await ctx.db.insert("fees", {
          studentId: userId,
          amount,
          status: "paid",
          dueDate,
          paidDate,
          description: feeDescriptions[Math.floor(Math.random() * feeDescriptions.length)],
          organizationId: adminOrgId,
          createdBy: admin._id,
          createdAt: dueDate - 7 * 24 * 60 * 60 * 1000,
        });
      }

      // 1-2 due fees
      const dueCount = 1 + Math.floor(Math.random() * 2);
      for (let f = 0; f < dueCount; f++) {
        const amount = feeAmounts[Math.floor(Math.random() * feeAmounts.length)];
        // Some overdue (past), some upcoming (future)
        const isOverdue = Math.random() > 0.5;
        const dueDate = isOverdue
          ? now - Math.floor(Math.random() * 45) * 24 * 60 * 60 * 1000 // 0-45 days overdue
          : now + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000; // due in 0-30 days

        await ctx.db.insert("fees", {
          studentId: userId,
          amount,
          status: "due",
          dueDate,
          description: feeDescriptions[Math.floor(Math.random() * feeDescriptions.length)],
          organizationId: adminOrgId,
          createdBy: admin._id,
          createdAt: dueDate - 14 * 24 * 60 * 60 * 1000,
        });
      }

      createdStudents.push({ userId, name, email });
    }

    // ==================== FEE QUERIES ====================
    // Create some mock fee queries for a subset of students
    const queryTypes = ["dispute", "clarification", "payment_issue", "extension_request", "other"] as const;
    const querySubjects = [
      "Payment not reflected",
      "Need extension for fee payment",
      "Incorrect fee amount",
      "Request for fee waiver",
      "Query about late fee charges",
      "Payment method issue",
    ];
    const queryDescriptions = [
      "I made the payment last week but it's still showing as due. Please check and update.",
      "Due to family financial issues, I need an extension of 2 weeks for the fee payment.",
      "The fee amount seems higher than what was communicated earlier. Please clarify.",
      "I would like to request a partial fee waiver due to financial hardship.",
      "I was charged late fee but I paid on time. Please review.",
      "I'm having trouble with the online payment. Can I pay via bank transfer?",
    ];

    // Get all fees for seeded students
    const allStudentFees = await ctx.db
      .query("fees")
      .withIndex("by_organization", (q) => q.eq("organizationId", adminOrgId))
      .collect();

    const studentFeeMap = new Map<string, typeof allStudentFees>();
    for (const fee of allStudentFees) {
      const existing = studentFeeMap.get(fee.studentId) || [];
      existing.push(fee);
      studentFeeMap.set(fee.studentId, existing);
    }

    // Create queries for ~40% of students
    for (const student of createdStudents) {
      if (Math.random() > 0.4) continue; // Skip 60% of students

      const studentFees = studentFeeMap.get(student.userId) || [];
      if (studentFees.length === 0) continue;

      // Pick a random fee (prefer due fees)
      const dueFees = studentFees.filter(f => f.status === "due");
      const targetFee = dueFees.length > 0
        ? dueFees[Math.floor(Math.random() * dueFees.length)]
        : studentFees[Math.floor(Math.random() * studentFees.length)];

      const queryIdx = Math.floor(Math.random() * querySubjects.length);
      const queryStatus = ["open", "in_progress", "resolved", "closed"][Math.floor(Math.random() * 4)] as "open" | "in_progress" | "resolved" | "closed";
      const queryCreatedAt = now - Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000; // 0-14 days ago

      const queryId = await ctx.db.insert("feeQueries", {
        feeId: targetFee._id,
        studentId: student.userId,
        organizationId: adminOrgId,
        type: queryTypes[Math.floor(Math.random() * queryTypes.length)],
        subject: querySubjects[queryIdx],
        description: queryDescriptions[queryIdx],
        status: queryStatus,
        createdAt: queryCreatedAt,
        ...(queryStatus === "resolved" || queryStatus === "closed" ? {
          resolvedBy: admin._id,
          resolvedAt: queryCreatedAt + Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000,
        } : {}),
      });

      // Add some messages to the thread (50% chance)
      if (Math.random() > 0.5) {
        // Admin response
        await ctx.db.insert("feeQueryMessages", {
          queryId,
          senderId: admin._id,
          senderRole: "admin",
          senderName: admin.name,
          message: "Thank you for reaching out. We are looking into this matter and will get back to you shortly.",
          createdAt: queryCreatedAt + 2 * 60 * 60 * 1000, // 2 hours after query
        });

        // Student follow-up (30% chance)
        if (Math.random() > 0.7) {
          await ctx.db.insert("feeQueryMessages", {
            queryId,
            senderId: student.userId,
            senderRole: "student",
            senderName: student.name,
            message: "Thank you for the quick response. Please let me know if you need any additional information.",
            createdAt: queryCreatedAt + 4 * 60 * 60 * 1000, // 4 hours after query
          });
        }
      }
    }

    // ==================== TEST ATTEMPTS ====================
    const tests = await ctx.db.query("tests")
      .withIndex("by_organization", (q) => q.eq("organizationId", adminOrgId))
      .collect()
      .then((all) => all.filter((t) => t.status === "published"));

    if (tests.length === 0) {
      return {
        message: `Created ${createdStudents.length} mock students with fees (no published tests found, skipped attempts)`,
        students: createdStudents,
      };
    }

    for (const student of createdStudents) {
      const attemptCount = 5 + Math.floor(Math.random() * 11);
      for (let i = 0; i < attemptCount; i++) {
        const test = tests[Math.floor(Math.random() * tests.length)];
        const questions = test.questions;

        const answers = await Promise.all(
          questions.map(async (qId) => {
            const question = await ctx.db.get(qId);
            const shouldAnswer = Math.random() > 0.1;
            if (!shouldAnswer) return { questionId: qId, selected: [] };
            const isCorrect = Math.random() > 0.4;
            const selectedOption = isCorrect ? question?.correctOptions[0] ?? 0 : Math.floor(Math.random() * 4);
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
          testId: test._id, userId: student.userId, answers, score, totalQuestions: questions.length,
          correct, incorrect, unanswered, startedAt: submittedAt - test.duration * 1000 * 0.8,
          submittedAt, status: "submitted",
        });
      }
    }

    return {
      message: `Created ${count} mock students with fees and test attempts in batch "${batch.name}"`,
      students: createdStudents,
    };
  },
});

// Used by student app to seed test attempts for their own account
export const seedMockAttempts = mutation({
  args: {
    userId: v.id("users"),
    count: v.optional(v.number()),
  },
  handler: async (ctx, { userId, count = 10 }) => {
    const caller = await requireAuth(ctx);

    // Allow admin or the user themselves
    if (caller.role !== "admin" && caller._id !== userId) {
      throw new Error("You can only seed attempts for yourself");
    }

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

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
      const test = tests[Math.floor(Math.random() * tests.length)];
      const questions = test.questions;

      const answers = await Promise.all(
        questions.map(async (qId) => {
          const question = await ctx.db.get(qId);
          const shouldAnswer = Math.random() > 0.1;
          if (!shouldAnswer) return { questionId: qId, selected: [] };
          const isCorrect = Math.random() > 0.35;
          const selectedOption = isCorrect ? question?.correctOptions[0] ?? 0 : Math.floor(Math.random() * 4);
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
      const daysAgo = Math.floor(Math.random() * 60);
      const hoursAgo = Math.floor(Math.random() * 24);
      const submittedAt = now - daysAgo * 24 * 60 * 60 * 1000 - hoursAgo * 60 * 60 * 1000;

      const attemptId = await ctx.db.insert("attempts", {
        testId: test._id, userId, answers, score, totalQuestions: questions.length,
        correct, incorrect, unanswered, startedAt: submittedAt - test.duration * 1000 * Math.random(),
        submittedAt, status: "submitted",
      });

      createdAttempts.push({ attemptId, testTitle: test.title, score: Math.round(score * 10) / 10, correct, incorrect, unanswered });
    }

    return { message: `Created ${count} mock attempts for user ${user.name}`, attempts: createdAttempts };
  },
});
