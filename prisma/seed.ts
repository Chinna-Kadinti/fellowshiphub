import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const seedPassword = (name: "SEED_ADMIN_PASSWORD" | "SEED_MEMBER_PASSWORD", localDefault: string) => {
  const value = process.env[name]?.trim();

  if (value) {
    if (value.length < 12) {
      throw new Error(`${name} must contain at least 12 characters.`);
    }

    return value;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} is required when seeding a production database.`);
  }

  return localDefault;
};

const addDays = (days: number) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
};

async function main() {
  const passwordAdmin = await bcrypt.hash(seedPassword("SEED_ADMIN_PASSWORD", "Admin@12345"), 12);
  const group = await prisma.group.upsert({
    where: { id: "seed-group" },
    update: {
      name: "EGF Connect",
      description: "Gather • Grow • Go — fellowship, spiritual growth, and Gospel mission."
    },
    create: {
      id: "seed-group",
      name: "EGF Connect",
      description: "Gather • Grow • Go — fellowship, spiritual growth, and Gospel mission."
    }
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@fellowshiphub.local" },
    update: {
      passwordHash: passwordAdmin,
      name: "Chinna Kadinti",
      role: "ADMIN",
      phone: null,
      area: null,
      phoneVisible: false,
      groupId: group.id
    },
    create: {
      id: "seed-admin",
      email: "admin@fellowshiphub.local",
      passwordHash: passwordAdmin,
      name: "Chinna Kadinti",
      role: "ADMIN",
      phoneVisible: false,
      groupId: group.id
    }
  });

  await prisma.user.deleteMany({
    where: {
      role: "MEMBER"
    }
  });

  const nextMeeting = await prisma.meeting.upsert({
    where: { id: "seed-meeting-next" },
    update: {
      title: "Abiding in Christ",
      date: addDays(3),
      speakerName: "Chinna Kadinti",
      worshipLeaderName: "",
      status: "PUBLISHED"
    },
    create: {
      id: "seed-meeting-next",
      groupId: group.id,
      title: "Abiding in Christ",
      description: "A practical study on remaining in Christ through prayer, obedience, and fellowship.",
      date: addDays(3),
      startTime: "19:00",
      endTime: "20:45",
      venueName: "Community Prayer Hall",
      address: "120 Fellowship Lane, Springfield",
      latitude: 39.799,
      longitude: -89.644,
      speakerName: "Chinna Kadinti",
      worshipLeaderName: "",
      biblePassage: "John 15:1-17",
      studyTopic: "Fruitfulness through abiding",
      discussionQuestions:
        "What does Jesus mean by abide? How do we recognize fruit in daily life? What practices help our group remain connected to Christ?",
      status: "PUBLISHED"
    }
  });

  const pastMeeting = await prisma.meeting.upsert({
    where: { id: "seed-meeting-past" },
    update: {
      date: addDays(-7),
      speakerName: "Chinna Kadinti",
      worshipLeaderName: "",
      status: "COMPLETED"
    },
    create: {
      id: "seed-meeting-past",
      groupId: group.id,
      title: "Faith That Works",
      description: "A discussion on living faith from James.",
      date: addDays(-7),
      startTime: "19:00",
      endTime: "20:30",
      venueName: "Community Prayer Hall",
      address: "120 Fellowship Lane, Springfield",
      speakerName: "Chinna Kadinti",
      worshipLeaderName: "",
      biblePassage: "James 2:14-26",
      studyTopic: "Active faith",
      discussionQuestions: "How does faith become visible? Where is our fellowship called to serve?",
      status: "COMPLETED"
    }
  });

  await Promise.all([
    prisma.announcement.upsert({
      where: { id: "seed-announcement-1" },
      update: {
        title: "Bring your John 15 notes",
        body: "Please read John 15 before the meeting and bring one observation to share.",
        pinned: true
      },
      create: {
        id: "seed-announcement-1",
        title: "Bring your John 15 notes",
        body: "Please read John 15 before the meeting and bring one observation to share.",
        priority: "IMPORTANT",
        pinned: true,
        createdById: admin.id
      }
    }),
    prisma.announcement.upsert({
      where: { id: "seed-announcement-2" },
      update: {},
      create: {
        id: "seed-announcement-2",
        title: "Refreshments rota updated",
        body: "Volunteer assignments for the next three meetings have been posted.",
        priority: "NORMAL",
        createdById: admin.id
      }
    }),
    prisma.studyResource.upsert({
      where: { id: "seed-resource-1" },
      update: {},
      create: {
        id: "seed-resource-1",
        title: "John 15 Study Guide",
        description: "Observation, interpretation, and application notes for this week's passage.",
        type: "NOTES",
        url: "https://www.biblegateway.com/passage/?search=John%2015&version=ESV",
        bibleTopic: "John 15",
        meetingId: nextMeeting.id,
        createdById: admin.id
      }
    })
  ]);

  const channels = await Promise.all(
    [
      ["General", "Group updates and everyday fellowship."],
      ["Prayer", "Prayer needs and encouragement."],
      ["Bible Questions", "Questions from the passage and study notes."],
      ["Event Planning", "Logistics for meetings and fellowship events."]
    ].map(([name, description]) =>
      prisma.discussionChannel.upsert({
        where: { name },
        update: { description },
        create: { name, description }
      })
    )
  );

  await prisma.discussionMessage.upsert({
    where: { id: "seed-message-1" },
    update: {},
    create: {
      id: "seed-message-1",
      channelId: channels[0].id,
      authorId: admin.id,
      content: "Welcome to EGF Connect. Gather • Grow • Go."
    }
  });

  for (let i = 0; i < 14; i += 1) {
    await prisma.bibleReadingPlan.upsert({
      where: { id: `seed-reading-${i + 1}` },
      update: {
        date: addDays(i),
        passage: i < 7 ? `John ${i + 1}` : `Psalm ${i + 17}`,
        description: i < 7 ? "Read and note one command, promise, or prayer." : "Read slowly and write a short response."
      },
      create: {
        id: `seed-reading-${i + 1}`,
        date: addDays(i),
        passage: i < 7 ? `John ${i + 1}` : `Psalm ${i + 17}`,
        description: i < 7 ? "Read and note one command, promise, or prayer." : "Read slowly and write a short response."
      }
    });
  }

  await Promise.all(
    [
      ["John 15:5", "I am the vine; you are the branches. Whoever abides in me and I in him bears much fruit."],
      ["Psalm 119:105", "Your word is a lamp to my feet and a light to my path."],
      ["Romans 12:12", "Rejoice in hope, be patient in tribulation, be constant in prayer."],
      ["Hebrews 10:24", "Let us consider how to stir up one another to love and good works."],
      ["Matthew 18:20", "For where two or three are gathered in my name, there am I among them."],
      ["Colossians 3:16", "Let the word of Christ dwell in you richly, teaching and admonishing one another."],
      ["Philippians 4:6", "Do not be anxious about anything, but in everything by prayer let your requests be made known to God."],
      ["Isaiah 40:31", "They who wait for the Lord shall renew their strength."],
      ["Micah 6:8", "What does the Lord require of you but to do justice, love kindness, and walk humbly with your God?"],
      ["1 Peter 4:10", "As each has received a gift, use it to serve one another."]
    ].map(([reference, text], index) =>
      prisma.dailyVerse.upsert({
        where: { id: `seed-verse-${index + 1}` },
        update: { reference, text },
        create: { id: `seed-verse-${index + 1}`, reference, text }
      })
    )
  );

  await prisma.volunteerAssignment.upsert({
      where: { meetingId_role: { meetingId: nextMeeting.id, role: "SPEAKER" } },
      update: { userId: admin.id },
      create: { meetingId: nextMeeting.id, userId: admin.id, role: "SPEAKER" }
    });
  await prisma.volunteerAssignment.deleteMany({
    where: {
      meetingId: nextMeeting.id,
      role: { in: ["WORSHIP_LEADER", "REFRESHMENTS"] }
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
