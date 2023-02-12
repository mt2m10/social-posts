import {
  Avatar,
  Box,
  Button,
  InputAdornment,
  MenuItem,
  TextField,
} from "@mui/material";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";

type Sns = "Mastodon" | "Misskey";

type Session = {
  type: Sns;
  instance: string;
  username: string | null;
  key: string;
  id: string | null;
};

type UserInfo = {
  instance: string;
  username: string;
  avatarUrl: string;
};

const SnsList: Sns[] = ["Mastodon", "Misskey"];

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [userInfoList, setUserInfoList] = useState<UserInfo[]>([]);

  const typeRef = useRef<HTMLInputElement>(null);
  const apiKeyRef = useRef<HTMLInputElement>(null);
  const instanceRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const postRef = useRef<HTMLInputElement>(null);

  const handleClickRegistration = async () => {
    const typeElm = typeRef.current;
    const apiKeyElm = apiKeyRef.current;
    const instanceElm = instanceRef.current;
    const usernameElm = usernameRef.current;

    if (typeElm && apiKeyElm && instanceElm && usernameElm) {
      const type = typeElm.value as Sns;
      const apiKey = apiKeyElm.value;
      const instance = instanceElm.value;
      const username = usernameElm.value;

      if (type === "Mastodon") {
        const res = await fetch(
          `https://${instance}/api/v1/accounts/verify_credentials`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          }
        );
        const data = await res.json();
        const session: Session = {
          type: type,
          instance: instance,
          username: data.username,
          key: apiKey,
          id: data.id,
        };
        sessions.push(session);
        localStorage.setItem("session", JSON.stringify(sessions));
        setSessions(sessions);
      }

      if (type === "Misskey") {
        const res = await fetch(`https://${instance}/api/users/show`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username,
          }),
        });
        const data = await res.json();
        const session: Session = {
          type: type,
          instance: instance,
          username: username,
          key: apiKey,
          id: data.id,
        };
        sessions.push(session);
        localStorage.setItem("session", JSON.stringify(sessions));
        setSessions(sessions);
      }
    }
  };

  const handleClickSend = () => {
    const postElm = postRef.current;
    if (postElm) {
      const post = postElm.value;

      for (const session of sessions) {
        if (session.type === "Mastodon") {
          fetch(`https://${session.instance}/api/v1/statuses`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.key}`,
            },
            body: JSON.stringify({
              status: post,
              visibility: "public",
            }),
          })
            .then((res) => res.json())
            .then((data) => console.log(data))
            .catch((err) => console.log(err));
        }

        if (session.type === "Misskey") {
          fetch(`https://${session.instance}/api/notes/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              i: session.key,
              text: post,
              viaMobile: false,
            }),
          })
            .then((res) => res.json())
            .then((data) => console.log(data))
            .catch((err) => console.log(err));
        }
      }

      postElm.value = "";
    }
  };

  const handleKeyUp = (e: any) => {
    if (e.ctrlKey) {
      if (e.keyCode == 13) {
        handleClickSend();
      }
    }
  };

  useEffect(() => {
    const postFieldElm: HTMLInputElement | null =
      document.querySelector("#postField");
    if (postFieldElm) {
      postFieldElm.focus();
    }
  }, []);

  useEffect(() => {
    (async () => {
      const strSession = localStorage.getItem("session");
      if (!strSession) return;
      const sessions: Session[] = JSON.parse(strSession);
      setSessions(sessions);

      if (sessions) {
        const userInfoList = [];
        for (const session of sessions) {
          if (session.type === "Mastodon") {
            const res = await fetch(
              `https://${session.instance}/api/v1/accounts/${session.id}`,
              {
                headers: {
                  Authorization: `Bearer ${session.key}`,
                },
              }
            );

            const data = await res.json();
            const userInfo: UserInfo = {
              instance: session.instance,
              username: data.username,
              avatarUrl: data.avatar,
            };

            userInfoList.push(userInfo);
          }

          if (session.type === "Misskey") {
            const res = await fetch(
              `https://${session.instance}/api/users/show`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  username: session.username,
                }),
              }
            );

            const data = await res.json();
            const userInfo: UserInfo = {
              instance: session.instance,
              username: data.name,
              avatarUrl: data.avatarUrl,
            };

            userInfoList.push(userInfo);
          }
        }

        setUserInfoList(userInfoList);
      }
    })();
  }, []);

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <Box sx={{ fontSize: "h3.fontSize" }}>Social Posts</Box>

        <Box
          sx={{
            m: 2,
            mb: 3,
          }}
        >
          <TextField
            id="select-sns"
            select
            label="Select"
            defaultValue="Mastodon"
            inputRef={typeRef}
            sx={{
              mr: 2,
            }}
          >
            {SnsList.map((sns) => (
              <MenuItem key={sns} value={sns}>
                {sns}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            id="instance"
            label="instance名"
            variant="standard"
            inputRef={instanceRef}
            sx={{
              mx: 2,
            }}
          />

          <TextField
            id="username"
            label="ユーザー名"
            variant="standard"
            inputRef={usernameRef}
            sx={{
              mx: 2,
            }}
          />

          <TextField
            id="api-key"
            label="API Key"
            variant="standard"
            inputRef={apiKeyRef}
            sx={{
              mx: 2,
            }}
          />

          <Button variant="contained" onClick={handleClickRegistration}>
            登録
          </Button>
        </Box>

        <Box
          sx={{
            m: 2,
            mb: 3,
          }}
        >
          {userInfoList.map((userInfo) => {
            return (
              <>
                <TextField
                  id="input-with-icon-textfield"
                  label={userInfo.instance}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Avatar
                          alt="avatar image"
                          src={userInfo.avatarUrl}
                          sx={{ width: 35, height: 35 }}
                        />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                  value={userInfo.username}
                  key={`${userInfo.instance}_${userInfo.username}`}
                  sx={{
                    mr: 2,
                  }}
                />
              </>
            );
          })}
        </Box>

        <Box
          sx={{
            m: 2,
            mb: 3,
          }}
        >
          <TextField
            id="postField"
            label="今どうしてる？"
            multiline
            rows={10}
            inputRef={postRef}
            onKeyDown={handleKeyUp}
            fullWidth
          />

          <Button variant="contained" onClick={handleClickSend} sx={{ mt: 1 }}>
            送信
          </Button>
        </Box>
      </main>
    </>
  );
}
