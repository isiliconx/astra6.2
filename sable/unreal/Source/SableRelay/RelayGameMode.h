#pragma once
#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "RelayGameMode.generated.h"

class ARelayRoom;

UCLASS()
class SABLERELAY_API ARelayGameMode : public AGameModeBase
{
    GENERATED_BODY()
public:
    ARelayGameMode();
    virtual void StartPlay() override;
    virtual void RestartPlayer(AController* NewPlayer) override;
    virtual void Tick(float Delta) override;
    void ResetChamber();
    bool IsFinished() const { return bFinished; }
    int32 TotalTurns() const;
    float Elapsed() const { return Clock; }
    ARelayRoom* Room() const { return Instrument; }
private:
    UPROPERTY() TObjectPtr<ARelayRoom> Instrument;
    int32 PreviousTurns=0;
    float Clock=0;
    bool bFinished=false;
    void PlacePlayer();
};
