#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "RelayOptics.h"
#include "RelayRoom.generated.h"

class UInstancedStaticMeshComponent;
class UProceduralMeshComponent;
class UStaticMesh;
class UStaticMeshComponent;
class UMaterialInstanceDynamic;
class UMaterialInterface;

// Local single-player set. Fixed surfaces are batched by mesh, finish and collision.
UCLASS()
class SABLERELAY_API ARelayRoom : public AActor
{
    GENERATED_BODY()
public:
    ARelayRoom();
    virtual void BeginPlay() override;
    virtual void Tick(float Delta) override;
    void LoadChamber(int32 Index);
    void TurnMirror(int32 Which, int32 Delta);
    int32 FocusedMirror(const FVector& Eye, const FVector& Forward) const;
    bool IsOnThreshold(const FVector& PawnPos) const;
    bool IsOpen() const { return Light.complete(Layout); }
    int32 Index() const { return Chapter; }
    int32 Rotations() const { return Actions; }
    const relay::Chamber& Optics() const { return Layout; }
    const relay::Trace& Beams() const { return Light; }
    static FVector World(relay::V2 Point, double HeightCm) { return FVector(Point.y*100., Point.x*100., HeightCm); }
private:
    enum Finish { Shale, Basalt, Sand, Bronze, Silver, Line, Photon, Violet, Amber, Inactive, Chalk, FinishCount };
    enum Form { Box, Drum, Orb, FormCount };
    UPROPERTY() TArray<TObjectPtr<UStaticMesh>> Shapes;
    UPROPERTY() TObjectPtr<UMaterialInterface> BaseMaterial;
    UPROPERTY() TArray<TObjectPtr<UMaterialInstanceDynamic>> Materials;
    UPROPERTY() TMap<int32,TObjectPtr<UInstancedStaticMeshComponent>> Batches;
    UPROPERTY() TArray<TObjectPtr<UStaticMeshComponent>> Fixtures;
    UPROPERTY() TArray<TObjectPtr<UStaticMeshComponent>> Changing;
    UPROPERTY() TObjectPtr<UStaticMeshComponent> Shutter;
    relay::Chamber Layout;
    relay::Trace Light;
    int32 Chapter=0, Actions=0;
    float ShutterLift=0;
    UPROPERTY() TObjectPtr<UProceduralMeshComponent> Seal;
    void BuildSeal();
    void BuildGallery();
    void RebuildApparatus();
    void UpdateLight();
    void Stamp(Form Shape,Finish FinishId,FVector Place,FVector Size,
               FRotator Rotation=FRotator::ZeroRotator,bool Solid=false);
    UStaticMeshComponent* Piece(Form Shape, Finish FinishId, FVector Place, FVector Size,
                                bool Dynamic, bool Solid=false, FRotator Rotation=FRotator::ZeroRotator);
    void Lamp(FVector Place,FLinearColor Color,float Power,float Radius);
};
