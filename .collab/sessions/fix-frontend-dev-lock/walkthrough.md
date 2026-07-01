# Walkthrough: Fix Frontend Dev Lock

## Goal
Restore the ability to run `npm run dev` in the frontend directory by clearing zombie processes and lock files.

## Actions Taken
1. **Identified Processes**:
   - Port 3000: PID 9748
   - Port 3001: PID 28608
2. **Identified Lock File**: `frontend/.next/dev/lock`
3. **Execution**:
   - Terminated processes 9748 and 28608.
   - Deleted `frontend/.next/dev/lock`.
4. **Verification**:
   - `Test-Path frontend/.next/dev/lock` returned `False`.
   - `netstat` returned no listeners for ports 3000 and 3001.

## Evidence
```powershell
PS C:\Users\Benjamin\Desktop\nutricion_app> Test-Path frontend/.next/dev/lock
False
PS C:\Users\Benjamin\Desktop\nutricion_app> netstat -ano | findstr :3000
PS C:\Users\Benjamin\Desktop\nutricion_app> netstat -ano | findstr :3001
```

## Next Steps
The user can now run `npm run dev` in the `frontend` directory.
