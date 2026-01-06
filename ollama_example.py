from langchain_ollama import ChatOllama
inputHum=str(input())
llm = ChatOllama(
    model="gemma3:270m",
    temperature=0,
    # other params...
)
messages = [
    (
        "system",
        "You are a Math / Science teacher ",
    ),
    ("human", "xin chào"),
]
ai_msg = llm.invoke(messages)
ai_msg
print(ai_msg.content)