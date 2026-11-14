@echo off
setlocal EnableExtensions

set /p "message=Digite a mensagem do commit: "

if "%message%"=="" (
  echo Mensagem vazia. Commit cancelado.
  pause
  exit /b 1
)

git add -A
if errorlevel 1 goto error

git diff --cached --quiet
if not errorlevel 1 (
  echo Nenhuma alteracao para commitar.
  pause
  exit /b 0
)

git commit -m "%message%"
if errorlevel 1 goto error

git push origin HEAD
if errorlevel 1 goto error

echo Commit e push concluidos com sucesso.
pause
exit /b 0

:error
echo Ocorreu um erro. Verifique a mensagem acima.
pause
exit /b 1
