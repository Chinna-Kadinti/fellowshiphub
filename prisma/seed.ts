import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const addDays = (days: number) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
};

async function main() {
  const passwordAdmin = await bcrypt.hash("Admin@12345", 12);
  const passwordMember = await bcrypt.hash("Member@12345", 12);

  const group = await prisma.group.upsert({
    where: { id: "seed-group" },
    update: {
      name: "FellowshipHub Bible Study",
      description: "Weekly Bible study fellowship and ministry coordination."
    },
    create: {
      id: "seed-group",
      name: "FellowshipHub Bible Study",
      description: "Weekly Bible study fellowship and ministry coordination."
    }
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@fellowshiphub.local" },
    update: {
      passwordHash: passwordAdmin,
      name: "Grace Leader",
      role: "ADMIN",
      phone: "555-0101",
      area: "Northside",
      phoneVisible: true,
      groupId: group.id
    },
    create: {
      id: "seed-admin",
      email: "admin@fellowshiphub.local",
      passwordHash: passwordAdmin,
      name: "Grace Leader",
      role: "ADMIN",
      phone: "555-0101",
      area: "Northside",
      phoneVisible: true,
      groupId: group.id
    }
  });

  const member = await prisma.user.upsert({
    where: { email: "member@fellowshiphub.local" },
    update: {
      passwordHash: passwordMember,
      name: "Daniel Member",
      role: "MEMBER",
      phone: "555-0102",
      area: "East End",
      phoneVisible: true,
      groupId: group.id
    },
    create: {
      id: "seed-member",
      email: "member@fellowshiphub.local",
      passwordHash: passwordMember,
      name: "Daniel Member",
      role: "MEMBER",
      phone: "555-0102",
      area: "East End",
      phoneVisible: true,
      groupId: group.id
    }
  });

  const extraMembers = await Promise.all(
    [
      ["seed-member-2", "Miriam Thomas", "miriam@fellowshiphub.local", "West Park"],
      ["seed-member-3", "Samuel Joseph", "samuel@fellowshiphub.local", "Downtown"],
      ["seed-member-4", "Lydia Paul", "lydia@fellowshiphub.local", "South Ridge"]
    ].map(([id, name, email, area]) =>
      prisma.user.upsert({
        where: { email },
        update: { name, area, groupId: group.id, role: "MEMBER" },
        create: {
          id,
          email,
          passwordHash: passwordMember,
          name,
          area,
          phone: "555-0199",
          phoneVisible: false,
          groupId: group.id
        }
      })
    )
  );

  const nextMeeting = await prisma.meeting.upsert({
    where: { id: "seed-meeting-next" },
    update: {
      title: "Abiding in Christ",
      date: addDays(3),
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
      speakerName: "Grace Leader",
      worshipLeaderName: "Miriam Thomas",
      biblePassage: "John 15:1-17",
      studyTopic: "Fruitfulness through abiding",
      discussionQuestions:
        "What does Jesus mean by abide? How do we recognize fruit in daily life? What practices help our group remain connected to Christ?",
      status: "PUBLISHED"
    }
  });

  const pastMeeting = await prisma.meeting.upsert({
    where: { id: "seed-meeting-past" },
    update: { date: addDays(-7), status: "COMPLETED" },
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
      speakerName: "Samuel Joseph",
      worshipLeaderName: "Lydia Paul",
      biblePassage: "James 2:14-26",
      studyTopic: "Active faith",
      discussionQuestions: "How does faith become visible? Where is our fellowship called to serve?",
      status: "COMPLETED"
    }
  });

  await Promise.all([
    prisma.rSVP.upsert({
      where: { meetingId_userId: { meetingId: nextMeeting.id, userId: member.id } },
      update: { status: "ATTENDING", arrivalStatus: "NOT_STARTED" },
      create: { meetingId: nextMeeting.id, userId: member.id, status: "ATTENDING" }
    }),
    prisma.rSVP.upsert({
      where: { meetingId_userId: { meetingId: nextMeeting.id, userId: extraMembers[0].id } },
      update: { status: "MAYBE" },
      create: { meetingId: nextMeeting.id, userId: extraMembers[0].id, status: "MAYBE" }
    }),
    prisma.rSVP.upsert({
      where: { meetingId_userId: { meetingId: nextMeeting.id, userId: extraMembers[1].id } },
      update: { status: "ATTENDING" },
      create: { meetingId: nextMeeting.id, userId: extraMembers[1].id, status: "ATTENDING" }
    }),
    prisma.attendance.upsert({
      where: { meetingId_userId: { meetingId: pastMeeting.id, userId: member.id } },
      update: { status: "PRESENT", checkInTime: addDays(-7) },
      create: { meetingId: pastMeeting.id, userId: member.id, status: "PRESENT", checkInTime: addDays(-7) }
    }),
    prisma.attendance.upsert({
      where: { meetingId_userId: { meetingId: pastMeeting.id, userId: extraMembers[0].id } },
      update: { status: "PRESENT", checkInTime: addDays(-7) },
      create: { meetingId: pastMeeting.id, userId: extraMembers[0].id, status: "PRESENT", checkInTime: addDays(-7) }
    })
  ]);

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

  await Promise.all([
    prisma.prayerRequest.upsert({
      where: { id: "seed-prayer-1" },
      update: {},
      create: {
        id: "seed-prayer-1",
        title: "Healing for a family member",
        description: "Please pray for recovery, comfort, and wisdom for the doctors.",
        category: "HEALTH",
        visibility: "PUBLIC",
        createdById: member.id
      }
    }),
    prisma.prayerRequest.upsert({
      where: { id: "seed-prayer-2" },
      update: {},
      create: {
        id: "seed-prayer-2",
        title: "Thanksgiving for answered prayer",
        description: "Grateful for a new job after several months of searching.",
        category: "THANKSGIVING",
        visibility: "PUBLIC",
        status: "ANSWERED",
        createdById: extraMembers[1].id
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
      content: "Welcome to FellowshipHub. Use these channels for study discussion and coordination."
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

  await Promise.all([
    prisma.volunteerAssignment.upsert({
      where: { meetingId_role: { meetingId: nextMeeting.id, role: "SPEAKER" } },
      update: { userId: admin.id },
      create: { meetingId: nextMeeting.id, userId: admin.id, role: "SPEAKER" }
    }),
    prisma.volunteerAssignment.upsert({
      where: { meetingId_role: { meetingId: nextMeeting.id, role: "WORSHIP_LEADER" } },
      update: { userId: extraMembers[0].id },
      create: { meetingId: nextMeeting.id, userId: extraMembers[0].id, role: "WORSHIP_LEADER" }
    }),
    prisma.volunteerAssignment.upsert({
      where: { meetingId_role: { meetingId: nextMeeting.id, role: "REFRESHMENTS" } },
      update: { userId: extraMembers[2].id },
      create: { meetingId: nextMeeting.id, userId: extraMembers[2].id, role: "REFRESHMENTS" }
    })
  ]);
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
