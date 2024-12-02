import { IMessage } from "../../types";

export const addMessage = async <F extends Function, D>(setState: F, newMessage: IMessage, interval: number = 1) =>
  new Promise((resolve, reject) => {
    {
      const length = newMessage.value.length;
      let currentIndex = 0;
      const intervalId = setInterval(() => {
        const currentMessage = newMessage.value.slice(0, currentIndex);
        setState((messages: D[]) => {
          return [
            ...messages.slice(0, -1),
            { ...newMessage, value: currentMessage, type: currentIndex === length ? newMessage.type : "typing" },
          ];
        });
        if (currentIndex === length) {
          clearInterval(intervalId);
          resolve(newMessage);
        }
        currentIndex++;
      }, interval);
    }
  });
