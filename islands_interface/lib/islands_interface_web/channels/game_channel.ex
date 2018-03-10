defmodule IslandsInterfaceWeb.GameChannel do
  use IslandsInterfaceWeb, :channel

  alias IslandsEngine.{Game, GameSupervisor}
  alias IslandsInterfaceWeb.Presence

  def join("game:" <> _player, %{"screen_name" => screen_name}, socket) do
    if authorized?(socket, screen_name) do
      send(self(), {:after_join, screen_name})
      {:ok, socket}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  def handle_in("hello", payload, socket) do
    broadcast! socket, "said_hello", payload
    {:noreply, socket}
  end

  def handle_in("new_game", _payload, socket) do
    "game:" <> player = socket.topic
    case GameSupervisor.start_game(player) do
      {:ok, _pid} -> {:reply, :ok, socket}
      {:error, reason} -> {:reply, {:error, %{reason: inspect(reason)}}, socket}
    end
  end

  def handle_in("add_player", player, socket) do
    case Game.add_player(via(socket.topic), player) do
      :ok ->
        broadcast! socket, "player_added", %{message: "New player just joined: " <> player}
        {:noreply, socket}
      {:error, reason} ->
        {:reply, {:error, %{reason: inspect(reason)}}, socket}
      :error ->
        {:reply, :error, socket}
    end
  end

  def handle_in(
    "position_island",
    %{"player" => player, "island" => island, "row" => row, "col" => col},
    socket
  ) do
    player = String.to_existing_atom(player)
    island = String.to_existing_atom(island)

    case Game.position_island(via(socket.topic), player, island, row, col) do
      :ok -> {:reply, :ok, socket}
      _ -> {:reply, :error, socket}
    end
  end

  def handle_in("set_islands", player, socket) do
    player = String.to_existing_atom(player)
    case Game.set_islands(via(socket.topic), player) do
      {:ok, board} ->
        broadcast! socket, "player_set_islands", %{player: player}
        {:reply, {:ok, %{board: board}}, socket}
      _ -> {:reply, :error, socket}
    end
  end

  def handle_in(
    "guess_coordinate",
    %{"player" => player, "row" => row, "col" => col},
    socket
  ) do
    player = String.to_existing_atom(player)

    case Game.guess_coordinate(via(socket.topic), player, row, col) do

      {:hit, island, win} ->
        result = %{hit: true, island: island, win: win}
        broadcast!(socket,"player_guessed_coordinate",
          %{player: player, row: row, col: col, result: result}
        )
        {:noreply, socket}

      {:miss, island, win} ->
        result = %{hit: false, island: island, win: win}
        broadcast!(
          socket,
          "player_guessed_coordinate",
          %{player: player, row: row, col: col, result: result}
        )
        {:noreply, socket}

      :error ->
        {:reply, {:error, %{player: player, reason: "Not your turn."}}, socket}

      {:error, reason} ->
        {:reply, {:error, %{player: player, reason: reason}}, socket}
    end
  end

  def handle_in("show_subscribers", _payload, socket) do
    broadcast!(socket,"subscribers", Presence.list(socket))
    {:noreply, socket}
  end

  def handle_info({:after_join, screen_name}, socket) do
    {:ok, _} =
      Presence.track(
        socket,
        screen_name,
        %{online_at: inspect(System.system_time(:seconds))}
      )
    {:noreply, socket}
  end

  ## Helpers

  ## Implementations

  defp via("game:" <> player), do: Game.via_tuple(player)

  def authorized?(socket, screen_name) do
    number_of_players(socket) < 2 && !existing_player?(socket, screen_name)
  end

  defp number_of_players(socket) do
    socket
    |> Presence.list()
    |> Map.keys()
    |> length()
  end

  defp existing_player?(socket, screen_name) do
    socket
    |> Presence.list()
    |> Map.has_key?(screen_name)
  end
end
