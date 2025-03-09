import { faker } from '@faker-js/faker';

import db from "../lib/prisma";
import { randomInt } from 'crypto';
import { Question, QuestionType, Submission } from '@prisma/client';

// Function to concatenate array elements separated by commas
function concatArray<T>(arr: T[]) {
  return arr.join(',');
}

// Function to randomize the order of the array and then pass it to the first function
function randomizeAndConcat<T>(arr: T[]) {
  // Randomize the array
  const randomizedArray = arr.sort(() => Math.random() - 0.5);
  // Concatenate the randomized array
  return concatArray(randomizedArray);
}


async function main() {
  const admin = await db.user.upsert({
    where: {
      githubId: 23456723
    },
    update: {},
    create: {
      username: 'abc',
      githubId: 23456723,
      role: "Admin"
    }
  })

  const [admin2, user1, user2] = await db.$transaction([
    db.user.create({
      data: {
        username: faker.person.fullName(),
        githubId: faker.number.int({ min: 1000000, max: 4000000 }),
        role: "Admin"
      }
    }),
    db.user.create({
      data: {
        username: faker.person.fullName(),
        githubId: faker.number.int({ min: 1000000, max: 4000000 }),
        role: "User"
      }
    }),
    db.user.create({
      data: {
        username: faker.person.fullName(),
        githubId: faker.number.int({ min: 1000000, max: 4000000 }),
        role: "User"
      }
    }),
  ])

  const candidateOwners = [admin.id, admin2.id, user1.id, user2.id]

  const tryoutCount = randomInt(3, 10);

  for (let i = 0; i < tryoutCount; i++) {
    const tryout = await db.tryout.create({
      data: {
        name: faker.book.title(),
        ownerId: candidateOwners[randomInt(candidateOwners.length)],
        description: faker.lorem.sentences(3),
        duration: faker.number.int({ min: 0, max: 86400 }),
        shuffled: faker.number.int({ min: 0, max: 1 }) === 1
      }
    })

    const submissionCount = randomInt(tryoutCount)
    const submissionAnswers: any[][] = []
    const submissionFlag: boolean[][] = []

    for (let k = 0; k < submissionCount; k++) {
      submissionAnswers.push([])
      submissionFlag.push([])
    }

    const questionIds: number[] = []
    const questions: Question[] = []
    let questionCount = randomInt(3, 7);
    const questionTypes: QuestionType[] = ["MULTIPLE_CHOICE", "SHORT_QUESTION", "ESSAY"]
    for (let j = 0; j < questionCount; j++) {
      let qType = questionTypes[randomInt(3)] // For 3 types of questions
      const question = await db.question.create({
        data: {
          type: qType,
          content: faker.lorem.lines(),
          weight: faker.number.float({ min: 1, max: 5 }),
          tryoutId: tryout.id
        }
      })
      questions.push(question)
      questionIds.push(question.id)

      for (let k = 0; k < submissionCount; k++) { // 20% Chance
        submissionFlag[k].push(randomInt(3) === 0)
      }

      if (qType === "MULTIPLE_CHOICE") {
        let choiceCount = randomInt(2, 5)
        const choices = []
        for (let k = 0; k < choiceCount; k++) {
          choices.push(
            db.choice.create({
              data: {
                content: faker.lorem.words({ min: 1, max: 10 }),
                questionId: question.id,
              }
            })
          )
        }
        const createdChoices = await db.$transaction(choices);
        const answerIdx = randomInt(choiceCount);
        const answer = await db.answer.create({
          data: {
            choiceId: createdChoices[answerIdx].id,
            questionId: question.id
          }
        })

        for (let k = 0; k < submissionCount; k++) {
          submissionAnswers[k].push({
            choice: createdChoices[randomInt(choiceCount)].id,
            questionIndex: j
          })
        }
      } else if (qType === "SHORT_QUESTION") {
        const answer = await db.answer.create({
          data: {
            questionId: question.id,
            content: faker.lorem.words({ min: 3, max: 10 })
          }
        })

        for (let k = 0; k < submissionCount; k++) {
          submissionAnswers[k].push({
            content: randomInt(1) === 1 ? answer.content : faker.lorem.words({ min: 3, max: 10 }),
            questionIndex: j
          })
        }
      } else {
        const answer = await db.answer.create({
          data: {
            questionId: question.id,
            content: faker.lorem.sentences({ min: 3, max: 10 })
          }
        })

        for (let k = 0; k < submissionCount; k++) {
          submissionAnswers[k].push({
            content: randomInt(1) === 1 ? answer.content : faker.lorem.sentences({ min: 3, max: 10 }),
            questionIndex: j
          })
        }
      }
    }

    const updatedTryout = await db.tryout.update({
      where: { id: tryout.id },
      data: {
        questionsOrder: tryout.shuffled ? null : concatArray(questionIds)
      }
    })


    for (let k = 0; k < submissionCount; k++) {
      const submission = await db.submission.create({
        data: {
          userId: candidateOwners[(i + k) % candidateOwners.length],
          tryoutId: tryout.id,
          questionsOrder: tryout.shuffled ? randomizeAndConcat(questionIds) : updatedTryout.questionsOrder,
        }
      })

      await db.$transaction(
        submissionAnswers[k].map((e) => {
          let res = {
            submissionId: submission.id,
            questionIndex: submission.questionsOrder?.split(',').findIndex((val) => (parseInt(val) === questionIds[e.questionIndex])) as number,
          }
          if (questions[e.questionIndex].type === "MULTIPLE_CHOICE") {
            return {
              ...res, choiceId: e.choice
            }
          }
          return {
            ...res, content: e.content
          }
        }).map((e) => db.submittedAnswer.create({ data: e }))
      )

      await db.$transaction(
        submissionFlag[k].filter((e) => e === true).map((e, i) => ({
          submissionId: submission.id,
          questionIndex: i
        })
        ).map((e) => db.flag.create({ data: e }))
      )
    }
  }
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