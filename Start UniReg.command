#!/bin/bash
# Double-click this file to start UniReg, then open http://localhost:8000
cd "$(dirname "$0")"
(sleep 1; open http://localhost:8000) &
python3 app.py
