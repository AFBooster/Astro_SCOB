@echo off
REM ============================================================================
REM  SCOB Night-Sky - one-click publish to GitHub Pages (Windows)
REM
REM  Usage:
REM    - Double-click this file, then type what changed when asked, OR
REM    - From a terminal:   publish.bat "what changed"
REM
REM  What it does: (optionally) runs the local tests, then commits every change
REM  and pushes to GitHub. The push triggers the GitHub Action, which runs the
REM  full test suite again and - only if everything passes - publishes the site.
REM ============================================================================

setlocal
cd /d "%~dp0"

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
echo  Committing and pushing
echo ============================================================
git add -A
git commit -m "%MSG%"
if errorlevel 1 echo   ^(Nothing new to commit - pushing any pending commits.^)
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

:failed
echo.
echo *** Local tests FAILED - fix the problem above before publishing. ***
echo *** Nothing was committed or pushed. ***
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
