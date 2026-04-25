/**
 * Few-shot examples to improve AI output formatting and quality.
 * Examples cover varying difficulty and standard styles for specific exams.
 */

export interface FewShotExample {
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct: string;
  explanation: string;
}

export const jeeExamples: FewShotExample[] = [
  {
    question: 'A particle undergoes simple harmonic motion with amplitude A and time period T. The time taken to travel from x = A to x = A/2 is:',
    options: {
      A: 'T / 8',
      B: 'T / 12',
      C: 'T / 6',
      D: 'T / 4',
    },
    correct: 'C',
    explanation: 'For a particle starting from the extreme position, the equation of motion is x = A cos(ωt). We need to find t when x = A/2. Thus, A/2 = A cos(ωt) => cos(ωt) = 1/2. This implies ωt = π/3. Since ω = 2π/T, we have (2π/T)t = π/3, which gives t = T/6. This is a fundamental concept in kinematics of SHM and illustrates non-uniform velocity execution.'
  },
  {
    question: 'Among the following, the compound that undergoes the fastest SN1 reaction is:',
    options: {
      A: '1-Chloro-2-methylpropane',
      B: '2-Chloro-2-methylpropane',
      C: '2-Chloropropane',
      D: '1-Chlorobutane',
    },
    correct: 'B',
    explanation: 'The SN1 reaction rate depends heavily on the stability of the intermediate carbocation formed after the leaving group departs. 2-Chloro-2-methylpropane (tert-butyl chloride) forms a 3° (tertiary) carbocation, which is highly stabilized by hyperconjugation and inductive effects (nine alpha hydrogens). The other molecules form less stable primary or secondary carbocations. Therefore, 2-Chloro-2-methylpropane reacts the fastest under SN1 conditions.'
  },
  {
    question: 'Let R be a relation defined on the set of natural numbers N as aRb if and only if a divides b. Then R is:',
    options: {
      A: 'Equivalence relation',
      B: 'Symmetric and transitive',
      C: 'Reflexive and transitive but not symmetric',
      D: 'Reflexive and symmetric but not transitive',
    },
    correct: 'C',
    explanation: 'Let\'s check the properties of R: 1) Reflexive: For any natural number a, "a divides a" is true. So aRa holds. 2) Transitive: If a divides b (b = ka) and b divides c (c = jb), then c = (jk)a, meaning a divides c. So aRb and bRc => aRc holds. 3) Symmetric: "2 divides 4" is true, but "4 divides 2" is not. Therefore, R is reflexive and transitive, but not symmetric, making it a partial order relation rather than an equivalence relation.'
  }
];

export const upscExamples: FewShotExample[] = [
  {
    question: 'Which one of the following statements correctly describes the meaning of legal tender money?',
    options: {
      A: 'The money which is tendered in courts of law to defray the fee of legal cases',
      B: 'The money which a creditor is under compulsion to accept in settlement of his claims',
      C: 'The bank money in the form of cheques, drafts, bills of exchange, etc.',
      D: 'The metallic money in circulation in a country',
    },
    correct: 'B',
    explanation: 'Legal tender is a medium of payment recognized by a legal system to be valid for meeting a financial obligation. Paper currency and coins are fiat money, which do not have intrinsic value like gold, but act as money because the government decrees it. Consequently, a creditor who is offered legal tender cannot refuse it in settlement of a debt. Cheques and drafts are fiduciary money (optional to accept), not legal tender.'
  },
  {
    question: 'With reference to the history of India, consider the following pairs: \n1. Aurang - In-charge of treasury of the State\n2. Banian - Indian agent of the East India Company\n3. Mirasidar - Designated revenue payer to the State\nWhich of the pairs given above is/are correctly matched?',
    options: {
      A: '1 and 2 only',
      B: '2 and 3 only',
      C: '3 only',
      D: '1, 2 and 3',
    },
    correct: 'B',
    explanation: '1 is incorrect: "Aurang" was a Persian term for a warehouse or a place where goods are collected before being sold, not a treasury official. 2 is correct: A "Banian" acted as an agent, broker, or factotum for European merchants and the East India Company in India. 3 is correct: A "Mirasidar" held hereditary land rights (mirasi) and was the designated proprietor and revenue-payer to the state in South India.'
  },
  {
    question: 'In the context of polity, which one of the following would you accept as the most appropriate definition of liberty?',
    options: {
      A: 'Protection against the tyranny of political rulers',
      B: 'Absence of restraint',
      C: 'Opportunity to do whatever one likes',
      D: 'Opportunity to develop oneself fully',
    },
    correct: 'D',
    explanation: 'In political science, liberty is not merely the absence of restraints (negative liberty) or the licence to do what one wishes. Positive liberty encompasses the availability of conditions that enable individuals to realize their potential and develop themselves fully. The Constitution guarantees liberty of thought, expression, belief, faith, and worship specifically to allow citizens to pursue holistic self-development without undue coercion.'
  }
];

export const getFewShotBlock = (examType: 'JEE' | 'UPSC' | 'BOTH'): string => {
  let examples: FewShotExample[] = [];
  
  if (examType === 'JEE') {
    examples = jeeExamples;
  } else if (examType === 'UPSC') {
    examples = upscExamples;
  } else {
    examples = [jeeExamples[0], upscExamples[0], jeeExamples[1]]; // Mix of both
  }

  const formatted = examples.map((ex, i) => `EXAMPLE ${i + 1}:
{
  "id": ${i + 1},
  "question": ${JSON.stringify(ex.question)},
  "options": {
    "A": ${JSON.stringify(ex.options.A)},
    "B": ${JSON.stringify(ex.options.B)},
    "C": ${JSON.stringify(ex.options.C)},
    "D": ${JSON.stringify(ex.options.D)}
  },
  "correct": "${ex.correct}",
  "explanation": ${JSON.stringify(ex.explanation)},
  "difficulty": "Medium",
  "topic": "Example Topic",
  "subtopic": "Example Subtopic",
  "examRelevance": "High"
}`).join('\n\n');

  return `Here are some high-quality examples of the output format and desired complexity:\n\n${formatted}\n\nMake sure your generated questions match this professional tone and complexity.\n`;
};
