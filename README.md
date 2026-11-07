# ChatGPT Image Generation Skill

Скилл для OpenCode: генерация и редактирование изображений через инструмент `gpt_imagegen` с использованием подписки ChatGPT, без OpenAI API key. Каждый вызов расходует квоту подписки.

## Установка скилла

```sh
git clone https://github.com/keeendaaa/chatgpt-imagegen-skill.git
mkdir -p ~/.config/opencode/skills/chatgpt-imagegen
cp chatgpt-imagegen-skill/SKILL.md ~/.config/opencode/skills/chatgpt-imagegen/SKILL.md
```

## Зависимость

Этот репозиторий содержит инструкции скилла, а не реализацию инструмента. Для работы нужен совместимый плагин, предоставляющий `gpt_imagegen`, и вход через ChatGPT OAuth. Локальная версия скилла рассчитана на адаптацию плагина для OpenCode V2; эта адаптация не включена в репозиторий.

Исходный проект плагина: https://github.com/yuji-hatakeyama/opencode-gpt-imagegen (исходная V1-точка входа не загружается в V2 без адаптации).

## Использование

Попросите OpenCode сгенерировать изображение через подписку ChatGPT и укажите сюжет, стиль и путь сохранения. Поддерживаемые размеры, параметры и обработка ошибок описаны в [SKILL.md](SKILL.md).

В репозиторий не включены личные настройки, OAuth-токены или другие данные авторизации.
