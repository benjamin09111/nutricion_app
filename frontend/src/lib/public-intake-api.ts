export async function validatePublicIntakeToken(token: string) {
  const response = await fetch(`/api/public/patient-intake/validate/${token}`);
  return response.json();
}

export async function submitPublicIntakeForm(token: string, body: unknown) {
  const response = await fetch(`/api/public/patient-intake/submit/${token}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return response;
}
