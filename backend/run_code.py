import subprocess
import tempfile
import os


def run_in_docker(code: str):
    tmpdir = tempfile.mkdtemp()
    code_path = os.path.join(tmpdir, "main.py")
    with open(code_path, "w") as f:
        f.write(code)

    cmd = [
        "docker", "run", "--rm",
        "--cpus", "0.5",
        "--memory", "128m",
        "-v", f"{tmpdir}:/app",
        "python:3.11-slim",
        "python", "/app/main.py"
    ]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        return {
            "stdout": proc.stdout,
            "stderr": proc.stderr,
            "returncode": proc.returncode,
        }
    except subprocess.TimeoutExpired:
        return {"stdout": "", "stderr": "Execution timed out", "returncode": -1}
