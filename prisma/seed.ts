
import db from "../lib/prisma";

async function main() {
  const admin = await db.user.create({
    data: {
      username: 'abc',
      githubId: 23456723,
      role: "Admin"
    }
  })

  const joe = await db.user.create({
    data: {
      username: 'Joe',
      githubId: 12345678,
      role: "User"
    }
  })

  const mandy = await db.user.create({
    data: {
      username: 'Mandy',
      githubId: 32145678,
      role: "User"
    }
  })

  const tryout = await db.tryout.create({
    data: {
      name: 'tes2t',
      ownerId: admin.id,
      description: "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Architecto dolorem possimus maiores distinctio itaque, fugiat sequi facere rem molestias est error magni sint, ipsa necessitatibus. Esse voluptate voluptatum maxime odio."
    }
  })

  const question1 = await db.question.create({
    data: {
      content: "Apakah nilai 1+3?",
      type: "MULTIPLE_CHOICE",
      weight: 2,
      tryoutId: tryout.id
    }
  })

  const choices1 = await db.choice.createManyAndReturn({
    data: [
      { content: '33', questionId: question1.id },
      { content: '122', questionId: question1.id },
      { content: '44', questionId: question1.id },
      { content: '4', questionId: question1.id }
    ]
  })

  const answer1 = await db.answer.create({
    data: {
      questionId: question1.id,
      choiceId: choices1[3].id
    }
  })

  const question2 = await db.question.create({
    data: {
      content: "Apakah nilai 3^3?",
      type: "SHORT_QUESTION",
      weight: 3,
      tryoutId: tryout.id
    }
  })

  const answer2 = await db.answer.create({
    data: {
      questionId: question2.id,
      content: "27"
    }
  })

  const question3 = await db.question.create({
    data: {
      content: "Apakah arti vektor?",
      type: "ESSAY",
      weight: 5,
      tryoutId: tryout.id
    }
  })

  const answer3 = await db.answer.create({
    data: {
      questionId: question3.id,
      content: "Vektor adalah anggota dari suatu ruang V yang memenuhi kesepuluh aksioma dalam operasi penjumlahan dan perkalian skalar."
    }
  })

  const updatedTryout = await db.tryout.update({
    where: {
      id: tryout.id
    },
    data: {
      questionsOrder: `${question2.id},${question3.id},${question1.id}`
    }
  })

  const mandySubmission = await db.submission.create({
    data: {
      userId: mandy.id,
      tryoutId: tryout.id,
      finished: true,
      submittedAnswers: {
        createMany: {
          data: [
            {
              questionIndex: 1,
              content: "Vektor adalah anggota dari suatu ruang V yang memenuhi kesepuluh aksioma dalam operasi penjumlahan dan perkalian skalar."
            },
            {
              questionIndex: 1,
              choiceId: choices1[2].id
            },
            {
              questionIndex: 2,
              content: "9"
            }
          ]
        }
      }
    }
  })

  const joeSubmission = await db.submission.create({
    data: {
      userId: joe.id,
      tryoutId: tryout.id,
      finished: true,
      submittedAnswers: {
        createMany: {
          data: [
            {
              questionIndex: 0,
              content: ":O Widih"
            },
            {
              questionIndex: 1,
              choiceId: choices1[1].id
            },
            {
              questionIndex: 2,
              content: "8"
            }
          ]
        }
      }
    }
  })
}

main()
  .then(async () => {
    await db.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    process.exit(1)
  })