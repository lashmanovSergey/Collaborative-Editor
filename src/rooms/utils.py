def get_room_html(uuid: str) -> str:
    return f'''
<!DOCTYPE html>
<html>
    <head>
        <title>good morning._.</title>
    </head>

    <textarea id="editing" oninput="update(this.value);"></textarea>

    <pre aria-hidden="true">
        <code id="content"></code>
    </pre>

    <script>
        let ws;

        function connect() {{
            ws = new WebSocket(`ws://localhost:8000/ws/{uuid}`);

            ws.onmessage = function(event) {{
                let element = document.querySelector("#content");
                element.innerText = event.data;

                let textarea = document.querySelector("#editing");
                textarea.innerText = event.data;
            }}

            ws.onclose = function(event) {{
                connect();
            }}
        }}

        connect();
        
        function update(text) {{
            ws.send(text);
        }}
    </script>
</html>
'''