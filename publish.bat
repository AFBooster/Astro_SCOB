@echo off
REM ============================================================================
REM  SCOB Night-Sky - one-click publish to GitHub Pages (Windows)
REM
REM  Usage:
REM    - Double-click this file, then type what changed when asked, OR
REM    - From a terminal:   publish.bat "what changed"
REM
REM  What it does: runs the local tests AND check-release.sh (auto-finding Git
REM  Bash, so you never have to type a bash path), then commits every change and
REM  pushes to GitHub. The push triggers the GitHub Action, which runs the full
REM  test suite again and - only if everything passes - publishes the site.
REM ============================================================================

setlocal
cd /d "%~dp0"

REM --- clear a stale git lock left by a crashed/earlier git process ---
if exist ".git\index.lock" (
  echo Removing stale .git\index.lock ...
  del /f /q ".git\index.lock"
)

REM --- commit message: from the argument, else ask, else a default ---
set "MSG=%~1"
if "%MSG%"=="" set /p "MSG=Describe what changed (then press Enter): "
if "%MSG%"=="" set "MSG=Update SCOB Night-Sky"

echo.
echo ============================================================
echo  Local pre-flight tests
echo ============================================================
where node >nul 2>nul
if %errorlevel%==0 (
  echo Running test-astro.js, test-pages.js, test-logic.js ...
  call node test-astro.js  || goto :failed
  call node test-pages.js  || goto :failed
  call node test-logic.js  || goto :failed
  echo All local tests passed.
) else (
  echo Node.js not found locally - skipping local tests.
  echo ^(The GitHub Action will still run every test before publishing.^)
)

echo.
echo ============================================================
echo  Release check (check-release.sh)
echo ============================================================
call :findbash
if defined BASH (
  echo Using bash: "%BASH%"
  "%BASH%" check-release.sh  || goto :failed
  echo Release check passed.
) else (
  echo Git Bash not found - skipping check-release.sh.
  echo   ^(Install Git for Windows to enable this step. The GitHub Action still
  echo    runs the test suite before the site is published, so this is a local
  echo    convenience, not the only gate.^)
)

echo.
echo ============================================================
echo  Committing and pushing
echo ============================================================
git add -A
git commit -m "%MSG%"
if errorlevel 1 echo   ^(Nothing new to commit - pushing any pending commits.^)

REM --- integrate any changes pushed from elsewhere, so the push isn't rejected ---
echo Syncing with GitHub before pushing...
git pull --no-edit
if errorlevel 1 goto :pullfail

git push
if errorlevel 1 goto :pushfail

echo.
echo ============================================================
echo  Pushed. The deploy is now running.
echo ------------------------------------------------------------
echo  Watch it:   https://github.com/AFBooster/Astro_SCOB/actions
echo  Live site:  https://afbooster.github.io/Astro_SCOB/
echo             ^(updates ~1 minute after the green tick^)
echo ============================================================
echo.
pause
exit /b 0

REM ============================================================================
REM  :findbash - locate a usable bash.exe without needing it on PATH.
REM  Prefers Git for Windows' bash (safe, self-contained) over a bare
REM  System32\bash.exe (the WSL launcher), which is only tried as a last resort.
REM  Sets BASH to the full path if found; leaves it empty otherwise.
REM ============================================================================
:findbash
set "BASH="
set "GITEXE="
set "GITROOT="

REM 1) Derive it from wherever git itself lives (covers non-standard install dirs)
for /f "delims=" %%I in ('where git 2^>nul') do if not defined GITEXE set "GITEXE=%%I"
if defined GITEXE for %%A in ("%GITEXE%\..\..") do set "GITROOT=%%~fA"
if defined GITROOT if exist "%GITROOT%\bin\bash.exe" set "BASH=%GITROOT%\bin\bash.exe"
if defined BASH goto :eof
if defined GITROOT if exist "%GITROOT%\usr\bin\bash.exe" set "BASH=%GITROOT%\usr\bin\bash.exe"
if defined BASH goto :eof

REM 2) The usual Git for Windows install locations
if exist "%ProgramFiles%\Git\bin\bash.exe" set "BASH=%ProgramFiles%\Git\bin\bash.exe"
if defined BASH goto :eof
if exist "%ProgramFiles(x86)%\Git\bin\bash.exe" set "BASH=%ProgramFiles(x86)%\Git\bin\bash.exe"
if defined BASH goto :eof
if exist "%LOCALAPPDATA%\Programs\Git\bin\bash.exe" set "BASH=%LOCALAPPDATA%\Programs\Git\bin\bash.exe"
if defined BASH goto :eof

REM 3) Last resort: any bash on PATH (may be the WSL launcher)
for /f "delims=" %%I in ('where bash 2^>nul') do if not defined BASH set "BASH=%%I"
goto :eof

:failed
echo.
echo *** Local checks FAILED - fix the problem above before publishing. ***
echo *** Nothing was committed or pushed. ***
echo.
pause
exit /b 1

:pullfail
echo.
echo *** git pull hit a merge conflict. ***
echo   Your commit is saved locally - nothing was lost.
echo   Open the files Git listed above, resolve the conflict markers
echo   ^(^<^<^<^<^<^<^<  =======  ^>^>^>^>^>^>^>^), then run:
echo       git add -A  ^&^&  git commit --no-edit  ^&^&  git push
echo.
pause
exit /b 1

:pushfail
echo.
echo *** git push failed. Common causes: ***
echo   - not signed in    ^(a browser window should open - approve it^)
echo   - remote rejected  ^(run:  git pull --no-edit  then try again^)
echo.
pause
exit /b 1
