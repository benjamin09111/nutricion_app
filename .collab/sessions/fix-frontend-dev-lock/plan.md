# Plan: Fix Frontend Dev Lock

The frontend dev server is failing to start because of a lock file in `.next/dev/lock` and potentially active processes on ports 3000/3001.

## Goal
Restore the ability to run `npm run dev` in the frontend directory.

## Scope
- Identify processes using ports 3000 and 3001.
- Terminate those processes.
- Remove the lock file at `frontend/.next/dev/lock`.

## Steps
1. **Research**: Confirm if the lock file exists and check for processes on ports 3000/3001.
2. **Execution**: 
    - Kill processes on ports 3000 and 3001.
    - Delete `frontend/.next/dev/lock`.
3. **Verification**: Confirm the lock file is removed.

## Risks
- Terminating a process might interrupt work if the user is intentionally running something else on those ports, but given the error, it's likely a zombie `next dev` process.

## Verification Commands
- `netstat -ano | findstr :3000`
- `netstat -ano | findstr :3001`
- `Test-Path frontend/.next/dev/lock`
