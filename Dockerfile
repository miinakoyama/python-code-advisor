FROM public.ecr.aws/lambda/python:3.11

COPY backend/requirements.txt ./
RUN pip install -r requirements.txt

COPY backend ./backend

CMD ["backend.main.handler"]
